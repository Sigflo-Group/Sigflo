export type ScannerTimingState = 'developing' | 'ready' | 'triggered' | 'extended' | 'expired';

export type ScannerTriggerType =
  | 'breakout_first_close'
  | 'breakout_retest_hold'
  | 'reclaim_first_close'
  | 'pullback_bounce_confirmed'
  | 'trend_continuation_resume'
  | 'mean_reversion_cooling'
  | 'unknown';

export interface ScannerPenaltyWeights {
  candlesLatePenalty: number;
  atrExtensionPenalty: number;
  percentExtensionPenalty: number;
  postTriggerImpulsePenalty: number;
  crowdedLevelPenalty: number;
  rrCompressionPenalty: number;
}

export interface ScannerActionabilityWeights {
  setupScore: number;
  timingScore: number;
  entryFreshnessScore: number;
  roomToTargetScore: number;
}

export interface ScannerLifecycleConfig {
  historyLimit: number;
  readyTimingMin: number;
  triggeredActionabilityMin: number;
  triggeredFreshnessMin: number;
  extendedAfterCandles: number;
  expiredAfterCandles: number;
  expiredViabilityFloor: number;
  timingDropFromPeakToExtend: number;
  atrExtensionWarning: number;
  atrExtensionHard: number;
  percentExtensionWarning: number;
  percentExtensionHard: number;
  minRoomToTargetAtr: number;
  oversizedBreakoutCandleAtr: number;
  actionabilityWeights: ScannerActionabilityWeights;
  penaltyWeights: ScannerPenaltyWeights;
}

export const SCANNER_LIFECYCLE_CONFIG: ScannerLifecycleConfig = {
  historyLimit: 10,
  readyTimingMin: 52,
  triggeredActionabilityMin: 52,
  triggeredFreshnessMin: 38,
  extendedAfterCandles: 8,
  expiredAfterCandles: 8,
  expiredViabilityFloor: 40,
  timingDropFromPeakToExtend: 18,
  atrExtensionWarning: 0.9,
  atrExtensionHard: 1.5,
  percentExtensionWarning: 0.8,
  percentExtensionHard: 1.8,
  minRoomToTargetAtr: 0.9,
  oversizedBreakoutCandleAtr: 1.6,
  actionabilityWeights: {
    setupScore: 0.35,
    timingScore: 0.3,
    entryFreshnessScore: 0.25,
    roomToTargetScore: 0.1,
  },
  penaltyWeights: {
    candlesLatePenalty: 0.2,
    atrExtensionPenalty: 0.24,
    percentExtensionPenalty: 0.16,
    postTriggerImpulsePenalty: 0.14,
    crowdedLevelPenalty: 0.12,
    rrCompressionPenalty: 0.14,
  },
};
