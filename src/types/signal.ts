export type SignalSide = 'long' | 'short';
export type SignalSetupTag = 'Breakout' | 'Pullback' | 'Overextended';
export type SignalRiskTag = 'Low Risk' | 'Medium Risk' | 'High Risk';
export type DirectionalBias =
  | 'strong_long'
  | 'long'
  | 'weak_long'
  | 'neutral'
  | 'weak_short'
  | 'short'
  | 'strong_short';
export type DirectionalRiskLevel = 'low' | 'moderate' | 'high';
export type SetupScoreLabel =
  | 'High conviction'
  | 'Strong setup'
  | 'Moderate setup'
  | 'Developing setup'
  | 'No trade';
export type SignalSetupType = 'breakout' | 'pullback' | 'overextended';

/** Strategy personality active when the lifecycle row was created (read-only telemetry). */
export type SignalLifecycleStrategyMode =
  | 'conservative_structure'
  | 'balanced'
  | 'aggressive_momentum'
  | 'breakout_specialist'
  | 'swing_structure';
export type SignalTimingState = 'developing' | 'ready' | 'triggered' | 'extended' | 'expired';
export type SignalLifecycleStage =
  | 'emerging'
  | 'developing'
  | 'confirmed'
  | 'active'
  | 'weakening'
  | 'invalidated'
  | 'completed';
export type SignalEventStatus =
  | 'emerging'
  | 'active'
  | 'evolving'
  | 'confirmed'
  | 'rejected'
  | 'failed'
  | 'completed'
  | 'archived';
export type SignalOutcome = 'win' | 'loss' | 'neutral' | null;
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
  directionalBias?: DirectionalBias;
  setupScore: number; // out of 100
  setupScoreLabel: SetupScoreLabel;
  confidence?: number; // out of 100 (directional certainty)
  setupQuality?: number; // out of 100 (execution quality)
  riskLevel?: DirectionalRiskLevel;
  higherTimeframeBias?: 'bullish' | 'bearish' | 'neutral';
  reasons?: string[];
  warnings?: string[];
  marketState?: {
    regime: 'trend' | 'range' | 'volatile' | 'compression';
    dominantBias: 'bullish' | 'bearish' | 'neutral';
    momentumState: 'strengthening' | 'weakening' | 'flat';
    volatilityState: 'expanding' | 'contracting';
    breakoutStatus: 'building' | 'confirmed' | 'failed';
  };
  signalLifecycleStage?: SignalLifecycleStage;
  setupType: SignalSetupType;
  scoreBreakdown: SetupScoreBreakdown;
  facts?: {
    emaTrend?: 'bullish' | 'bearish' | 'neutral';
    volumeRatio?: number;
    rsi?: number;
    distanceToBreakoutAtr?: number;
    pullbackDepthAtr?: number;
    extensionAtr?: number;
    confidence?: number;
    setupQuality?: number;
    structureStrength?: number;
    higherTimeframeBias?: 'bullish' | 'bearish' | 'neutral';
    counterTrend?: 'yes' | 'no';
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

export interface SignalLifecycleEvent {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: '15m';
  bias: SignalSide;
  confidence: number;
  setupType: SignalSetupType;
  entryContext: {
    entryPrice: number;
    atrAtCreation: number;
    marketRegime?: CryptoSignal['marketState'] extends infer T
      ? T extends { regime: infer R }
        ? R
        : never
      : never;
  };
  invalidationLevel: number;
  targetLevel: number;
  status: SignalEventStatus;
  outcome: SignalOutcome;
  maxFavorableExcursion: number;
  maxAdverseExcursion: number;
  qualityScore: number | null;
  notes: string[];
  completedAt?: number;
  /** Present for signals registered after this field shipped; required for strategy–regime attribution. */
  strategyPersonalityMode?: SignalLifecycleStrategyMode;
}
