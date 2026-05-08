import type { ScannerActionabilityWeights } from '@/lib/scannerConfig';

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function scoreToUnit(n: number): number {
  return clamp01(n / 100);
}

export function computeActionabilityScore(
  args: {
    setupScore: number;
    timingScore: number;
    entryFreshnessScore: number;
    roomToTargetScore: number;
  },
  weights: ScannerActionabilityWeights,
): number {
  const sum =
    scoreToUnit(args.setupScore) * weights.setupScore +
    scoreToUnit(args.timingScore) * weights.timingScore +
    scoreToUnit(args.entryFreshnessScore) * weights.entryFreshnessScore +
    scoreToUnit(args.roomToTargetScore) * weights.roomToTargetScore;
  return Math.round(clamp01(sum) * 100);
}
