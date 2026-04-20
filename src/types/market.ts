export type KlineInterval = '1' | '5' | '15' | '60' | '240' | 'D' | 'W';

export type PlaybackCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
};

export interface Candle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed?: boolean;
}

export interface SymbolTicker {
  symbol: string;
  lastPrice: number;
  /** Linear perps: Bybit mark price (fair basis for % SL/TP when distinct from last). */
  markPrice?: number;
  /** Linear perps: Bybit index price (external basket reference; MEXC-style “Index” trigger). */
  indexPrice?: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  turnover24h: number;
  price24hPcnt: number;
}

export interface SymbolUniverseItem {
  symbol: string;
  volume24h: number;
  turnover24h: number;
}
