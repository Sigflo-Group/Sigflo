export type RegimeKind = 'trend' | 'range' | 'volatile' | 'compression';

export type RegimeTransitionPressures = {
  trendToRange: number;
  rangeToTrend: number;
  compressionToExpansion: number;
  expansionToCompression: number;
  stableToVolatile: number;
  volatileToStable: number;
};

export type RegimePredictorOutput = {
  currentRegime: RegimeKind;
  regimeStability: number;
  shiftProbability: number;
  likelyNextRegime: RegimeKind | null;
  earlyWarningSignals: string[];
  supportingEvidence: string[];
  riskFlags: string[];
  transitionPressures: RegimeTransitionPressures;
};

export type RegimePredictorState = {
  symbol: string;
  updatedAt: number;
  output: RegimePredictorOutput;
};
