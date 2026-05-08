import type { ScannerLifecycleConfig } from '@/lib/scannerConfig';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export interface TimingPenaltyBreakdown {
  candlesLatePenalty: number;
  atrExtensionPenalty: number;
  percentExtensionPenalty: number;
  postTriggerImpulsePenalty: number;
  crowdedLevelPenalty: number;
  rrCompressionPenalty: number;
}

export function emptyPenaltyBreakdown(): TimingPenaltyBreakdown {
  return {
    candlesLatePenalty: 0,
    atrExtensionPenalty: 0,
    percentExtensionPenalty: 0,
    postTriggerImpulsePenalty: 0,
    crowdedLevelPenalty: 0,
    rrCompressionPenalty: 0,
  };
}

export function sumPenalties(p: TimingPenaltyBreakdown): number {
  return (
    p.candlesLatePenalty +
    p.atrExtensionPenalty +
    p.percentExtensionPenalty +
    p.postTriggerImpulsePenalty +
    p.crowdedLevelPenalty +
    p.rrCompressionPenalty
  );
}

export function buildPenaltyBreakdown(args: {
  candlesSinceTrigger: number | null;
  atrExtensionFromIdeal: number;
  pctExtensionFromIdeal: number;
  postTriggerImpulseCandles: number;
  roomToTargetScore: number;
  config: ScannerLifecycleConfig;
}): TimingPenaltyBreakdown {
  const p = emptyPenaltyBreakdown();
  const { config } = args;

  if (args.candlesSinceTrigger != null) {
    p.candlesLatePenalty = clamp((args.candlesSinceTrigger - 1) * 7, 0, 28);
  }

  p.atrExtensionPenalty = clamp(
    ((Math.max(0, args.atrExtensionFromIdeal - config.atrExtensionWarning) /
      Math.max(0.001, config.atrExtensionHard - config.atrExtensionWarning)) *
      28),
    0,
    28,
  );

  p.percentExtensionPenalty = clamp(
    ((Math.max(0, args.pctExtensionFromIdeal - config.percentExtensionWarning) /
      Math.max(0.001, config.percentExtensionHard - config.percentExtensionWarning)) *
      20),
    0,
    20,
  );

  p.postTriggerImpulsePenalty = clamp(args.postTriggerImpulseCandles * 5, 0, 20);
  p.crowdedLevelPenalty = args.roomToTargetScore < 35 ? clamp((35 - args.roomToTargetScore) * 0.45, 0, 16) : 0;
  p.rrCompressionPenalty = args.roomToTargetScore < 45 ? clamp((45 - args.roomToTargetScore) * 0.3, 0, 14) : 0;
  return p;
}

export function computeEntryFreshnessScore(penalties: TimingPenaltyBreakdown): number {
  return clamp(Math.round(100 - sumPenalties(penalties)), 0, 100);
}
