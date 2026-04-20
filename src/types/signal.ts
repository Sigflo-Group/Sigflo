export type SignalSide = 'long' | 'short';
export type SignalSetupTag = 'Breakout' | 'Pullback' | 'Overextended';
export type SignalRiskTag = 'Low Risk' | 'Medium Risk' | 'High Risk';
export type SetupScoreLabel = 'Elite setup' | 'Strong setup' | 'Developing' | 'Low quality' | 'Avoid';
export type SignalSetupType = 'breakout' | 'pullback' | 'overextended';
export type SignalTimingState = 'developing' | 'ready' | 'triggered' | 'extended' | 'expired';
export type SignalTriggerType =
  | 'breakout_first_close'
  | 'breakout_retest_hold'
  | 'reclaim_first_close'
  | 'pullback_bounce_confirmed'
  | 'trend_continuation_resume'
  | 'unknown';

export interface SetupScoreBreakdown {
  trendAlignment: number; // 0-25
  momentumQuality: number; // 0-20
  structureQuality: number; // 0-25
  volumeConfirmation: number; // 0-15
  riskConditions: number; // 0-15
}

export interface CryptoSignal {
  id: string;
  pair: string;
  side: SignalSide;
  biasLabel: string;
  setupScore: number; // out of 100
  setupScoreLabel: SetupScoreLabel;
  setupType: SignalSetupType;
  scoreBreakdown: SetupScoreBreakdown;
  facts?: {
    emaTrend?: 'bullish' | 'bearish' | 'neutral';
    volumeRatio?: number;
    rsi?: number;
    distanceToBreakoutAtr?: number;
    pullbackDepthAtr?: number;
    extensionAtr?: number;
  };
  riskTag: SignalRiskTag;
  setupTags: SignalSetupTag[];
  exchange: string;
  postedAgo: string;
  aiExplanation: string;
  whyThisMatters: string;
  timingState?: SignalTimingState;
  timingScore?: number;
  entryFreshnessScore?: number;
  roomToTargetScore?: number;
  actionabilityScore?: number;
  triggerType?: SignalTriggerType;
  triggerReason?: string;
  idealEntryPrice?: number;
  candlesSinceTrigger?: number;
  candlesSincePeakTiming?: number;
  penaltyBreakdown?: {
    candlesLatePenalty: number;
    atrExtensionPenalty: number;
    percentExtensionPenalty: number;
    postTriggerImpulsePenalty: number;
    crowdedLevelPenalty: number;
    rrCompressionPenalty: number;
  };
  positiveTimingFactors?: string[];
  scannerDiagnosticsNote?: string;
  /** Optional one-line “what to watch” for UI; otherwise derived in `resolveWatchCue`. */
  watchCue?: string;
  /** Optional forward cue (“what happens next”); otherwise derived in `resolveWatchNextCue`. */
  watchNext?: string;
  /**
   * When provided by API or deep-link, used as the trade plan (entry / SL / TP).
   * Otherwise `buildTradeViewModelFromSignal` derives levels from the live anchor price.
   */
  plannedEntry?: number;
  plannedStop?: number;
  plannedTarget?: number;
}
