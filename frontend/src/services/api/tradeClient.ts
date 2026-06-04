import { apiJson } from './http';

export type ExitAutomationWatchApi = {
  id: string;
  exchange: string;
  market: string;
  enabled: boolean;
  symbol: string;
  side: 'long' | 'short';
  positionIdx: number;
  stopPrice: number;
  targetPrice: number;
  trendAlignment: number;
  momentumQuality: number;
  strategyPreset: 'protect_profit' | 'trend_follow' | 'tight_risk' | 'custom';
  customStrategyThresholds: Record<string, number> | null;
  safeguards: {
    maxLossPct: number;
    minProfitBeforeTrimPct: number;
    allowPartialExits: boolean;
    allowFullAutoClose: boolean;
  };
  lastGuidanceState: 'hold' | 'trim' | 'exit';
  lastError: string | null;
  lastCheckedAt: string | null;
  lastActionAt: string | null;
  updatedAt: string;
};

export type PutExitAutomationWatchBody = {
  enabled: boolean;
  symbol: string;
  side: 'long' | 'short';
  positionIdx?: number;
  stopPrice: number;
  targetPrice: number;
  trendAlignment: number;
  momentumQuality: number;
  strategyPreset: ExitAutomationWatchApi['strategyPreset'];
  customStrategyThresholds: Record<string, number> | null;
  safeguards: ExitAutomationWatchApi['safeguards'];
  lastGuidanceState?: ExitAutomationWatchApi['lastGuidanceState'];
  exchange?: 'bybit';
  market?: 'linear';
};

export async function listExitAutomationWatches(): Promise<{ watches: ExitAutomationWatchApi[] }> {
  return apiJson<{ watches: ExitAutomationWatchApi[] }>('/exit-watch');
}

export async function putExitAutomationWatch(body: PutExitAutomationWatchBody): Promise<{ watch: ExitAutomationWatchApi }> {
  return apiJson<{ watch: ExitAutomationWatchApi }>('/exit-watch', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteExitAutomationWatch(params: {
  symbol: string;
  side: 'long' | 'short';
  positionIdx?: number;
}): Promise<void> {
  const q = new URLSearchParams({
    exchange: 'bybit',
    symbol: params.symbol,
    side: params.side,
    positionIdx: String(params.positionIdx ?? 0),
  });
  await apiJson<void>(`/exit-watch?${q.toString()}`, { method: 'DELETE' });
}

export type BybitLinearOrderResponse = {
  ok: true;
  exchange: string;
  orderId: string;
  orderLinkId: string | null;
  note?: string;
};

export type BybitSetLeverageResponse = {
  ok: true;
  exchange: string;
  note?: string;
};

/** Set linear perp leverage on Bybit (`/v5/position/set-leverage`) — updates an open position’s leverage. */
export async function postBybitSetLinearLeverage(body: {
  symbol: string;
  leverage: number;
}): Promise<BybitSetLeverageResponse> {
  return apiJson<BybitSetLeverageResponse>('/trade/bybit/set-leverage', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function postBybitLinearOrder(body: {
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType?: 'Market' | 'Limit';
  qty: string;
  reduceOnly?: boolean;
  price?: string;
  positionIdx?: number;
  leverage?: number;
  /** Linear perps: attached TP/SL (market exit when hit). Omitted when unset. */
  takeProfit?: string;
  stopLoss?: string;
  tpTriggerBy?: 'MarkPrice' | 'LastPrice' | 'IndexPrice';
  slTriggerBy?: 'MarkPrice' | 'LastPrice' | 'IndexPrice';
}): Promise<BybitLinearOrderResponse> {
  return apiJson<BybitLinearOrderResponse>('/trade/bybit/linear-order', {
    method: 'POST',
    body: JSON.stringify({
      orderType: 'Market',
      ...body,
    }),
  });
}

export type BybitLinearTradingStopResponse = {
  ok: true;
  exchange: string;
  note?: string;
};

/** Set full-position TP/SL on an open linear perp (`"0"` clears a leg). */
export async function postBybitLinearTradingStop(body: {
  symbol: string;
  positionIdx?: number;
  takeProfit: string;
  stopLoss: string;
  tpTriggerBy?: 'MarkPrice' | 'LastPrice' | 'IndexPrice';
  slTriggerBy?: 'MarkPrice' | 'LastPrice' | 'IndexPrice';
}): Promise<BybitLinearTradingStopResponse> {
  return apiJson<BybitLinearTradingStopResponse>('/trade/bybit/linear-trading-stop', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type MexcLinearOrderResponse = {
  ok: true;
  exchange: string;
  orderId: string;
  orderLinkId: null;
  note?: string;
};

export async function postMexcLinearOrder(body: {
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType?: 'Market' | 'Limit';
  qty: string;
  reduceOnly?: boolean;
  price?: string;
  leverage?: number;
  takeProfit?: string;
  stopLoss?: string;
}): Promise<MexcLinearOrderResponse> {
  return apiJson<MexcLinearOrderResponse>('/trade/mexc/linear-order', {
    method: 'POST',
    body: JSON.stringify({
      orderType: 'Market',
      ...body,
    }),
  });
}

export type MexcLinearTradingStopResponse = {
  ok: true;
  exchange: string;
  orderIds: string[];
  note?: string;
};

/**
 * Set full-position TP/SL on an open MEXC futures position. Implemented via stop-market
 * orders. Pass "0" (or omit) for a side to skip / clear it.
 */
export async function postMexcLinearTradingStop(body: {
  symbol: string;
  positionSide: 'long' | 'short';
  qty: string;
  takeProfit?: string;
  stopLoss?: string;
}): Promise<MexcLinearTradingStopResponse> {
  return apiJson<MexcLinearTradingStopResponse>('/trade/mexc/linear-trading-stop', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function postBybitSpotOrder(body: {
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType?: 'Market' | 'Limit';
  qty: string;
  marketUnit: 'baseCoin' | 'quoteCoin';
  price?: string;
}): Promise<BybitLinearOrderResponse> {
  return apiJson<BybitLinearOrderResponse>('/trade/bybit/spot-order', {
    method: 'POST',
    body: JSON.stringify({
      orderType: 'Market',
      ...body,
    }),
  });
}
