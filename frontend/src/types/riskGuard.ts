/** Daily loss envelope vs user max daily loss (percent of equity / plan context). */
export type DailyRiskGuardStatus = 'normal' | 'warning' | 'locked';

export type DailyRiskGuardModel = {
  /** Signed P&L for the session (USD); demo until wired to exchange. */
  currentDailyPnl: number;
  /** Signed session return, percent (negative = drawdown). */
  currentDailyPnlPct: number;
  /** From Risk controls (`maxDailyLossPct`). */
  dailyLossLimitPct: number;
  status: DailyRiskGuardStatus;
  /** Short line for banners / command bar. */
  message: string;
};
