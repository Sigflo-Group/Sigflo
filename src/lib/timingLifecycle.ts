import { computeActionabilityScore } from '@/lib/actionabilityScore';
import {
  buildPenaltyBreakdown,
  computeEntryFreshnessScore,
  emptyPenaltyBreakdown,
  type TimingPenaltyBreakdown,
} from '@/lib/entryFreshness';
import {
  SCANNER_LIFECYCLE_CONFIG,
  type ScannerLifecycleConfig,
  type ScannerTimingState,
  type ScannerTriggerType,
} from '@/lib/scannerConfig';
import { evaluateBreakoutTiming } from '@/lib/timingEvaluators/breakoutTiming';
import { evaluatePullbackTiming } from '@/lib/timingEvaluators/pullbackTiming';
import { evaluateReclaimTiming } from '@/lib/timingEvaluators/reclaimTiming';
import { atr, ema, recentSwingHigh, recentSwingLow, rsi } from '@/lib/indicators';
import type { SignalSetupType, SignalSide } from '@/types/signal';
import type { Candle } from '@/types/market';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export interface TriggerMetadata {
  triggerType: ScannerTriggerType;
  triggerReason: string;
  firstValidEntryCandleIndex: number | null;
  idealEntryPrice: number | null;
}

export interface TimingSnapshot {
  candleIndex: number;
  timingScore: number;
  entryFreshnessScore: number;
  roomToTargetScore: number;
  actionabilityScore: number;
  state: ScannerTimingState;
}

export interface CandidateLifecycle {
  state: ScannerTimingState;
  trigger: TriggerMetadata;
  timingHistory: TimingSnapshot[];
  peakTimingScore: number;
  peakTimingCandleIndex: number | null;
  peakActionabilityScore: number;
  peakActionabilityCandleIndex: number | null;
  candlesSinceTrigger: number | null;
  candlesSincePeakTiming: number | null;
  candlesSincePeakActionability: number | null;
  penalties: TimingPenaltyBreakdown;
  positiveFactors: string[];
}

export interface TimingDiagnostics {
  setupType: SignalSetupType;
  timingScore: number;
  entryFreshnessScore: number;
  roomToTargetScore: number;
  actionabilityScore: number;
  state: ScannerTimingState;
  triggerType: ScannerTriggerType;
  idealEntryPrice: number | null;
  currentPrice: number;
  atrExtensionFromIdeal: number;
  candlesSinceTrigger: number | null;
  candlesSincePeakTiming: number | null;
  penalties: TimingPenaltyBreakdown;
  positiveFactors: string[];
}

function computeRoomToTargetScore(args: {
  side: SignalSide;
  close: number;
  swingHigh: number;
  swingLow: number;
  atrNow: number;
  config: ScannerLifecycleConfig;
}): { score: number; roomToTargetAtr: number } {
  const target =
    args.side === 'long' ? args.swingHigh + args.atrNow * 0.7 : args.swingLow - args.atrNow * 0.7;
  const roomRaw = args.side === 'long' ? target - args.close : args.close - target;
  const roomAtr = args.atrNow > 0 ? roomRaw / args.atrNow : 0;
  const score = clamp(
    Math.round((roomAtr / Math.max(0.1, args.config.minRoomToTargetAtr * 2.4)) * 100),
    0,
    100,
  );
  return { score, roomToTargetAtr: roomAtr };
}

function computeState(args: {
  triggerSeen: boolean;
  timingScore: number;
  freshnessScore: number;
  actionabilityScore: number;
  candlesSinceTrigger: number | null;
  candlesSincePeakTiming: number | null;
  peakTimingScore: number;
  config: ScannerLifecycleConfig;
  history: TimingSnapshot[];
}): ScannerTimingState {
  const { config } = args;
  const trailing = args.history.slice(-config.expiredAfterCandles);
  const belowFloorStreak =
    trailing.length >= config.expiredAfterCandles &&
    trailing.every((x) => x.timingScore < config.expiredViabilityFloor && x.actionabilityScore < config.expiredViabilityFloor);

  if (belowFloorStreak) return 'expired';
  if (!args.triggerSeen) {
    if (args.timingScore >= config.readyTimingMin) return 'ready';
    return 'developing';
  }
  if (
    args.actionabilityScore >= config.triggeredActionabilityMin &&
    args.freshnessScore >= config.triggeredFreshnessMin &&
    (args.candlesSinceTrigger ?? 0) <= config.extendedAfterCandles
  ) {
    return 'triggered';
  }
  const timingDroppedFromPeak = args.peakTimingScore - args.timingScore >= config.timingDropFromPeakToExtend;
  if (
    timingDroppedFromPeak ||
    (args.candlesSincePeakTiming ?? 0) >= config.extendedAfterCandles ||
    (args.candlesSinceTrigger ?? 0) >= config.extendedAfterCandles
  ) {
    if ((args.candlesSinceTrigger ?? 0) >= config.expiredAfterCandles && args.freshnessScore < config.expiredViabilityFloor) {
      return 'expired';
    }
    return 'extended';
  }
  return 'triggered';
}

export function evaluateTimingLifecycle(args: {
  setupType: SignalSetupType;
  side: SignalSide;
  setupScore: number;
  candles: Candle[];
  previous?: CandidateLifecycle;
  config?: ScannerLifecycleConfig;
}): { lifecycle: CandidateLifecycle; diagnostics: TimingDiagnostics } {
  const config = args.config ?? SCANNER_LIFECYCLE_CONFIG;
  const candles = args.candles;
  const close = candles.at(-1)?.close ?? 0;
  const prevClose = candles.at(-2)?.close ?? close;
  const atrNow = Math.max(1e-8, atr(candles, 14).at(-1) ?? 0);
  const rsiSeries = rsi(candles.map((c) => c.close), 14);
  const rsiNow = rsiSeries.at(-1) ?? 50;
  const rsiPrev = rsiSeries.at(-2) ?? rsiNow;
  const rsiSlope = rsiNow - rsiPrev;
  const ema20Series = ema(candles.map((c) => c.close), 20);
  const ema20 = ema20Series.at(-1) ?? close;
  const swingHigh = recentSwingHigh(candles, 40);
  const swingLow = recentSwingLow(candles, 40);
  // Breakout trigger levels must come from completed history, not the active candle.
  const priorCandles = candles.length > 1 ? candles.slice(0, -1) : candles;
  const triggerSwingHigh = recentSwingHigh(priorCandles, 40) || swingHigh;
  const triggerSwingLow = recentSwingLow(priorCandles, 40) || swingLow;
  const candleRange = (candles.at(-1)?.high ?? close) - (candles.at(-1)?.low ?? close);
  const volume = candles.at(-1)?.volume ?? 0;
  const volumeAvg =
    candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / Math.max(1, Math.min(20, candles.length));
  const volumeRatio = volumeAvg > 0 ? volume / volumeAvg : 1;
  const pullbackDepthAtr = atrNow > 0 ? (args.side === 'long' ? (ema20 - close) / atrNow : (close - ema20) / atrNow) : 0;
  const bounceStrengthAtr = atrNow > 0 ? Math.abs(close - prevClose) / atrNow : 0;
  const { score: roomToTargetScore, roomToTargetAtr } = computeRoomToTargetScore({
    side: args.side,
    close,
    swingHigh,
    swingLow,
    atrNow,
    config,
  });

  const existingTrigger = args.previous?.trigger?.firstValidEntryCandleIndex != null;
  const breakout = evaluateBreakoutTiming({
    side: args.side,
    close,
    prevClose,
    triggerLevel: args.side === 'long' ? triggerSwingHigh : triggerSwingLow,
    atrNow,
    candleRange,
    roomToTargetAtr,
    volumeRatio,
    rsiNow,
    rsiSlope,
    hasPreviousTrigger: existingTrigger,
  });
  const pullback = evaluatePullbackTiming({
    side: args.side,
    close,
    prevClose,
    ema20,
    atrNow,
    pullbackDepthAtr,
    bounceCandleStrengthAtr: bounceStrengthAtr,
    roomToTargetAtr,
    rsiNow,
    rsiSlope,
  });
  const reclaim = evaluateReclaimTiming({
    side: args.side,
    close,
    prevClose,
    reclaimLevel: ema20,
    atrNow,
    roomToTargetAtr,
    rsiSlope,
    hasPreviousTrigger: existingTrigger,
  });

  const selected =
    args.setupType === 'pullback' ? pullback : args.setupType === 'breakout' ? breakout : reclaim;

  const candleIndex = Math.max(0, candles.length - 1);
  const previousTrigger = args.previous?.trigger;
  const firstValidEntryCandleIndex =
    previousTrigger?.firstValidEntryCandleIndex != null
      ? previousTrigger.firstValidEntryCandleIndex
      : selected.triggerHit
        ? candleIndex
        : null;
  const idealEntryPrice =
    previousTrigger?.idealEntryPrice != null
      ? previousTrigger.idealEntryPrice
      : selected.triggerHit
        ? close
        : null;

  const candlesSinceTrigger =
    firstValidEntryCandleIndex != null ? Math.max(0, candleIndex - firstValidEntryCandleIndex) : null;
  const atrExtensionFromIdeal =
    idealEntryPrice != null ? Math.abs(close - idealEntryPrice) / Math.max(atrNow, 1e-8) : 0;
  const pctExtensionFromIdeal =
    idealEntryPrice != null ? (Math.abs(close - idealEntryPrice) / Math.max(idealEntryPrice, 1e-8)) * 100 : 0;
  const postTriggerImpulseCandles =
    candlesSinceTrigger != null
      ? candles.slice(-(candlesSinceTrigger + 1)).filter((c) => (args.side === 'long' ? c.close > c.open : c.close < c.open)).length
      : 0;

  const penalties =
    firstValidEntryCandleIndex == null
      ? emptyPenaltyBreakdown()
      : buildPenaltyBreakdown({
          candlesSinceTrigger,
          atrExtensionFromIdeal,
          pctExtensionFromIdeal,
          postTriggerImpulseCandles,
          roomToTargetScore,
          config,
        });

  const weightedPenalty =
    penalties.candlesLatePenalty * config.penaltyWeights.candlesLatePenalty +
    penalties.atrExtensionPenalty * config.penaltyWeights.atrExtensionPenalty +
    penalties.percentExtensionPenalty * config.penaltyWeights.percentExtensionPenalty +
    penalties.postTriggerImpulsePenalty * config.penaltyWeights.postTriggerImpulsePenalty +
    penalties.crowdedLevelPenalty * config.penaltyWeights.crowdedLevelPenalty +
    penalties.rrCompressionPenalty * config.penaltyWeights.rrCompressionPenalty;

  const safeWeightedPenalty = Number.isFinite(weightedPenalty) ? weightedPenalty : 0;
  const timingScore = clamp(Math.round(selected.timingScore - safeWeightedPenalty), 0, 100);
  const entryFreshnessScore = computeEntryFreshnessScore(penalties);
  const actionabilityScore = computeActionabilityScore(
    {
      setupScore: args.setupScore,
      timingScore,
      entryFreshnessScore,
      roomToTargetScore,
    },
    config.actionabilityWeights,
  );

  const previousHistory = args.previous?.timingHistory ?? [];
  const historyWithoutNewest = [...previousHistory].slice(-Math.max(0, config.historyLimit - 1));
  const peakTimingScore = Math.max(args.previous?.peakTimingScore ?? 0, timingScore);
  const peakTimingCandleIndex =
    peakTimingScore === timingScore ? candleIndex : (args.previous?.peakTimingCandleIndex ?? candleIndex);
  const peakActionabilityScore = Math.max(args.previous?.peakActionabilityScore ?? 0, actionabilityScore);
  const peakActionabilityCandleIndex =
    peakActionabilityScore === actionabilityScore
      ? candleIndex
      : (args.previous?.peakActionabilityCandleIndex ?? candleIndex);

  const candlesSincePeakTiming =
    peakTimingCandleIndex != null ? Math.max(0, candleIndex - peakTimingCandleIndex) : null;
  const candlesSincePeakActionability =
    peakActionabilityCandleIndex != null
      ? Math.max(0, candleIndex - peakActionabilityCandleIndex)
      : null;

  const provisionalHistory = [
    ...historyWithoutNewest,
    {
      candleIndex,
      timingScore,
      entryFreshnessScore,
      roomToTargetScore,
      actionabilityScore,
      state: 'developing' as ScannerTimingState,
    },
  ];

  const state = computeState({
    triggerSeen: firstValidEntryCandleIndex != null,
    timingScore,
    freshnessScore: entryFreshnessScore,
    actionabilityScore,
    candlesSinceTrigger,
    candlesSincePeakTiming,
    peakTimingScore,
    config,
    history: provisionalHistory,
  });

  const timingHistory = [...historyWithoutNewest, { ...provisionalHistory.at(-1)!, state }];
  const lifecycle: CandidateLifecycle = {
    state,
    trigger: {
      triggerType: previousTrigger?.triggerType && previousTrigger.triggerType !== 'unknown'
        ? previousTrigger.triggerType
        : selected.triggerType,
      triggerReason: selected.triggerReason,
      firstValidEntryCandleIndex,
      idealEntryPrice,
    },
    timingHistory,
    peakTimingScore,
    peakTimingCandleIndex,
    peakActionabilityScore,
    peakActionabilityCandleIndex,
    candlesSinceTrigger,
    candlesSincePeakTiming,
    candlesSincePeakActionability,
    penalties,
    positiveFactors: selected.positiveFactors,
  };

  return {
    lifecycle,
    diagnostics: {
      setupType: args.setupType,
      timingScore,
      entryFreshnessScore,
      roomToTargetScore,
      actionabilityScore,
      state,
      triggerType: lifecycle.trigger.triggerType,
      idealEntryPrice,
      currentPrice: close,
      atrExtensionFromIdeal: Number(atrExtensionFromIdeal.toFixed(3)),
      candlesSinceTrigger,
      candlesSincePeakTiming,
      penalties,
      positiveFactors: selected.positiveFactors,
    },
  };
}
