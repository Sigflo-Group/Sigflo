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
import { evaluateMeanReversionTiming } from '@/lib/timingEvaluators/meanReversionTiming';
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
  /** @deprecated Use triggerCandleTs — ring-buffer indices are unreliable. */
  firstValidEntryCandleIndex: number | null;
  /** Timestamp (ms) of the candle on which the trigger was first confirmed.
   *  Used for candlesSinceTrigger counting — the ring-buffered array index is unreliable. */
  triggerCandleTs: number | null;
  idealEntryPrice: number | null;
}

export interface TimingSnapshot {
  /** @deprecated Use candle ts fields — ring-buffer indices are unreliable. */
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
  /** @deprecated Use peakTimingCandleTs. */
  peakTimingCandleIndex: number | null;
  /** Timestamp of the candle where timing score peaked. Replaces index for elapsed-candle counting. */
  peakTimingCandleTs: number | null;
  peakActionabilityScore: number;
  /** @deprecated Use peakActionabilityCandleTs. */
  peakActionabilityCandleIndex: number | null;
  /** Timestamp of the candle where actionability score peaked. */
  peakActionabilityCandleTs: number | null;
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
  // Check belowFloorStreak only when no fresh trigger exists — a re-armed trigger
  // on the current candle should not be immediately extinguished by stale history.
  const belowFloorStreak =
    args.triggerSeen === false &&
    (() => {
      const trailing = args.history.slice(-config.expiredAfterCandles);
      return trailing.length >= config.expiredAfterCandles &&
        trailing.every((x) => x.timingScore < config.expiredViabilityFloor && x.actionabilityScore < config.expiredViabilityFloor);
    })();

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
  if (args.timingScore >= config.readyTimingMin) return 'ready';
  return 'developing';
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

  const existingTrigger = args.previous?.trigger?.triggerCandleTs != null;
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
    previousState: args.previous?.state ?? null,
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
  const meanReversion = evaluateMeanReversionTiming({
    side: args.side,
    close,
    prevClose,
    ema20,
    atrNow,
    rsiNow,
    rsiPrev,
    rsiSlope,
    roomToTargetAtr,
    hasPreviousTrigger: existingTrigger,
  });

  const selected =
    args.setupType === 'pullback'
      ? pullback
      : args.setupType === 'breakout'
        ? breakout
        : args.setupType === 'overextended'
          ? meanReversion
          : reclaim;

  const candleIndex = Math.max(0, candles.length - 1);
  const lastCandleTs = candles.at(-1)?.ts ?? null;
  const oldestCandleTs = candles.at(0)?.ts ?? null;
  const previousTrigger = args.previous?.trigger;
  const previousTriggerIndex = previousTrigger?.firstValidEntryCandleIndex ?? null;
  // Use timestamp-based elapsed-candle counting: the ring-buffered array is capped at 240
  // entries, so `candles.length - 1` is always 239, making index subtraction permanently 0.
  const previousTriggerTs = previousTrigger?.triggerCandleTs ?? null;
  const previousCandlesSinceTrigger =
    previousTriggerTs != null
      ? oldestCandleTs != null && previousTriggerTs < oldestCandleTs
        ? candles.length
        : candles.filter((c) => c.ts > previousTriggerTs).length
      : null;
  const shouldRearmTrigger =
    selected.triggerHit &&
    (
      previousTriggerTs == null ||
      args.previous?.state === 'extended' ||
      args.previous?.state === 'expired' ||
      (previousCandlesSinceTrigger != null && previousCandlesSinceTrigger > config.extendedAfterCandles)
    );
  const shouldClearStaleTrigger =
    !selected.triggerHit &&
    previousTriggerTs != null &&
    (
      args.previous?.state === 'expired' ||
      (previousCandlesSinceTrigger != null && previousCandlesSinceTrigger > config.expiredAfterCandles)
    );
  const triggerCandleTs = shouldRearmTrigger
    ? lastCandleTs
    : shouldClearStaleTrigger
      ? null
      : previousTriggerTs;
  const firstValidEntryCandleIndex = shouldRearmTrigger
    ? candleIndex
    : shouldClearStaleTrigger
      ? null
      : previousTriggerIndex;
  const idealEntryPrice = shouldRearmTrigger
    ? close
    : shouldClearStaleTrigger
      ? null
      : (previousTrigger?.idealEntryPrice ?? null);

  // If triggerCandleTs predates the oldest buffered candle the filter would
  // return all 240 entries, inflating candlesSinceTrigger to the full ring
  // size and causing a premature extended/expired transition. Cap it instead.
  // Use strict < (not <=): when the timestamps are equal the trigger candle is
  // still present in the buffer, so the filter correctly returns length-1.
  // The <= form over-counts by 1 for any trigger that lands on the oldest bar.
  const candlesSinceTrigger =
    triggerCandleTs != null
      ? oldestCandleTs != null && triggerCandleTs < oldestCandleTs
        ? candles.length          // treat as fully elapsed — stale trigger
        : candles.filter((c) => c.ts > triggerCandleTs).length
      : null;
  const atrExtensionFromIdeal =
    idealEntryPrice != null ? Math.abs(close - idealEntryPrice) / Math.max(atrNow, 1e-8) : 0;
  const pctExtensionFromIdeal =
    idealEntryPrice != null ? (Math.abs(close - idealEntryPrice) / Math.max(idealEntryPrice, 1e-8)) * 100 : 0;
  const postTriggerImpulseCandles =
    candlesSinceTrigger != null && candlesSinceTrigger > 0
      ? candles.slice(-Math.min(candlesSinceTrigger, candles.length, config.extendedAfterCandles + 2)).filter((c) => (args.side === 'long' ? c.close > c.open : c.close < c.open)).length
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
  const effectivePriorPeak = shouldRearmTrigger ? 0 : (args.previous?.peakTimingScore ?? 0);
  const peakTimingScore = Math.max(effectivePriorPeak, timingScore);
  const isNewTimingPeak = timingScore > effectivePriorPeak;
  const peakTimingCandleIndex = (isNewTimingPeak || shouldRearmTrigger) ? candleIndex : (args.previous?.peakTimingCandleIndex ?? candleIndex);
  const peakTimingCandleTs = (isNewTimingPeak || shouldRearmTrigger) ? lastCandleTs : (args.previous?.peakTimingCandleTs ?? lastCandleTs);

  const effectivePriorActionabilityPeak = shouldRearmTrigger ? 0 : (args.previous?.peakActionabilityScore ?? 0);
  const peakActionabilityScore = Math.max(effectivePriorActionabilityPeak, actionabilityScore);
  const isNewActionabilityPeak = actionabilityScore > effectivePriorActionabilityPeak;
  const peakActionabilityCandleIndex = (isNewActionabilityPeak || shouldRearmTrigger) ? candleIndex : (args.previous?.peakActionabilityCandleIndex ?? candleIndex);
  const peakActionabilityCandleTs = (isNewActionabilityPeak || shouldRearmTrigger) ? lastCandleTs : (args.previous?.peakActionabilityCandleTs ?? lastCandleTs);

  const candlesSincePeakTiming =
    peakTimingCandleTs != null
      ? oldestCandleTs != null && peakTimingCandleTs < oldestCandleTs
        ? candles.length
        : candles.filter((c) => c.ts > peakTimingCandleTs).length
      : null;
  const candlesSincePeakActionability =
    peakActionabilityCandleTs != null
      ? oldestCandleTs != null && peakActionabilityCandleTs < oldestCandleTs
        ? candles.length
        : candles.filter((c) => c.ts > peakActionabilityCandleTs).length
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
    triggerSeen: triggerCandleTs != null,
    timingScore,
    freshnessScore: entryFreshnessScore,
    actionabilityScore,
    candlesSinceTrigger,
    candlesSincePeakTiming,
    peakTimingScore,
    config,
    history: provisionalHistory,
  });

  const timingHistory = provisionalHistory.length > 0
    ? [...historyWithoutNewest, { ...provisionalHistory.at(-1)!, state }]
    : [...historyWithoutNewest];
  const lifecycle: CandidateLifecycle = {
    state,
    trigger: {
      triggerType:
        shouldClearStaleTrigger
          ? 'unknown'
          : shouldRearmTrigger || !previousTrigger?.triggerType || previousTrigger.triggerType === 'unknown'
          ? selected.triggerType
          : previousTrigger.triggerType,
      triggerReason: selected.triggerReason,
      firstValidEntryCandleIndex,
      triggerCandleTs,
      idealEntryPrice,
    },
    timingHistory,
    peakTimingScore,
    peakTimingCandleIndex,
    peakTimingCandleTs,
    peakActionabilityScore,
    peakActionabilityCandleIndex,
    peakActionabilityCandleTs,
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
