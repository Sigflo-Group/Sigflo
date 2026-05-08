export type TradeDirection = 'long' | 'short';

export type ExecutionRiskSummary = {
  liquidationBufferPct: number;
  riskRewardRatio: number;
  estimatedMarginUsd: number;
};

export type TradeExecutionIntentRequest = {
  symbol: string;
  direction: TradeDirection;
  positionSizeUsd: number;
  leverage: number;
  stopPrice?: number;
  targetPrice?: number;
  brokerAccountId?: string;
};

export type TradeExecutionIntentResponse = {
  intentId: string;
  executionToken: string;
  expiresAt: string;
  preview: {
    symbol: string;
    direction: TradeDirection;
    positionSizeUsd: number;
    leverage: number;
    stopPrice?: number;
    targetPrice?: number;
    riskSummary: ExecutionRiskSummary;
  };
};

export type TradeExecuteRequest = {
  executionToken: string;
  idempotencyKey: string;
};

export type TradeExecuteResponse = {
  ok: true;
  trade: TradeRecord;
};

export type TradeRecord = {
  id: string;
  tradeIntentId: string | null;
  symbol: string;
  direction: TradeDirection;
  positionSizeUsd: number;
  leverage: number;
  entryPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  status: string;
  brokerOrderId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type MarketMode = 'futures' | 'spot';
export type TradeSide = 'long' | 'short';
export type TradeTrend = 'Bullish' | 'Bearish' | 'Neutral';
export type TradeMomentum = 'Strong' | 'Building' | 'Weak';
export type RiskLevel = 'Low' | 'Medium' | 'High';

/** Pre-entry / in-trade lifecycle — separate from {@link ExecutionQuality}. */
export type SetupDisplayState = 'building' | 'triggered' | 'in_position';

/** Post-fill quality only; never used as a “timing” label before entry. */
export type ExecutionQuality = 'strong' | 'okay' | 'weak';

export interface TradeChartCandle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface AiInsight {
  trend: TradeTrend;
  momentum: TradeMomentum;
  risk: RiskLevel;
  summary: string;
}

export interface RiskSummary {
  setupScore: number;
  positionSizeUsd: number;
  walletUsedPct: number;
  recommendedUsagePct: number;
  oversizingRelativeToSetup: boolean;
  liquidationBufferPct: number;
  liquidationRisk: RiskLevel;
  riskMeterPct: number;
  tradeScore: number;
  /** Setup lifecycle label for diagnostics / future UI (Building | Triggered | In position). */
  setupDisplayState?: SetupDisplayState;
  /** Set when a position is open; orthogonal to timing chip before entry. */
  executionQuality?: ExecutionQuality | null;
  /** Points subtracted from base trade score (0 / 3 / 8). */
  executionPenaltyApplied?: number;
  setupTradeConflictMessage?: string;
  walletImpactLabel: string;
  primaryMessage: string;
  warnings: string[];
}

export interface TradeViewModel {
  pair: string;
  side: TradeSide;
  lastPrice: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  entry: number;
  stop: number;
  target: number;
  liquidation: number;
  balanceUsd: number;
  amountUsedUsd: number;
  leverage: number;
  positionSizeUsd: number;
  targetProfitUsd: number;
  stopLossUsd: number;
  riskReward: number;
  aiInsight: AiInsight;
  /** Normalized 0–1 sparkline series for chart mini-plot (oldest → newest). */
  priceSeries: number[];
  /** Optional OHLC series for real candlestick rendering (oldest -> newest). */
  chartCandles?: TradeChartCandle[];
}
