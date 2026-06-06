import type { MarketMode, TradeSide } from '@/types/trade';
import type { TradeSource } from '@/types/tradeSource';
import type { SigfloActivePosition } from '@/types/position';

export type PaperOrderSide = 'buy' | 'sell';
export type PaperOrderType = 'open' | 'close';

export type PaperTradingOrder = {
  id: string;
  createdAt: number;
  type: PaperOrderType;
  side: PaperOrderSide;
  pair: string;
  market: MarketMode;
  direction: TradeSide;
  entryPrice: number;
  notionalUsd: number;
  leverage: number;
  status: 'filled';
  note?: string;
  realizedPnlUsd?: number;
  source: TradeSource;
};

export type PaperTradingClosedTrade = {
  id: string;
  pair: string;
  market: MarketMode;
  direction: TradeSide;
  openedAt: number;
  closedAt: number;
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  notionalUsd: number;
  realizedPnlUsd: number;
  reason: 'manual_close' | 'close_all' | 'flip_position';
  source: TradeSource;
};

export type PaperTradeOpenInput = {
  pair: string;
  market: MarketMode;
  direction: TradeSide;
  entryPrice: number;
  notionalUsd: number;
  leverage: number;
  stopPrice?: number | null;
  targets?: number[];
  source?: TradeSource | 'demo' | 'bybit' | 'mexc';
  openedAt?: number;
};

export type PaperTradingSnapshot = {
  startingBalanceUsd: number;
  cashUsd: number;
  lockedMarginUsd: number;
  unrealizedPnlUsd: number;
  realizedPnlUsd: number;
  equityUsd: number;
  portfolioValueUsd: number;
  positions: SigfloActivePosition[];
  orders: PaperTradingOrder[];
  closedTrades: PaperTradingClosedTrade[];
};
