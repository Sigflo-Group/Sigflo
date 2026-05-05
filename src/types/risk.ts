export type SigfloRiskMode = 'Defensive' | 'Balanced' | 'Aggressive';

/** Persisted risk envelope for Sigflo (localStorage today; server later). */
export type SigfloRiskSettings = {
  riskMode: SigfloRiskMode;
  /** Max notional risk per new trade, percent of equity / plan context (product-defined). */
  maxRiskPerTradePct: number;
  maxDailyLossPct: number;
  maxOpenPositions: number;
  /** When false, Sigflo does not submit opening / sizing / TP-SL orders to the broker (closes may still be allowed separately). */
  allowLiveExecution: boolean;
  requireConfirmation: boolean;
  paperModeDefault: boolean;
};
