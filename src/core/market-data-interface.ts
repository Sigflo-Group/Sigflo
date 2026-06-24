import type { Candle, KlineInterval, SymbolTicker, SymbolUniverseItem } from '@/types/market';

export type ExchangeId = 'bybit' | 'mexc';

export type WsConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export type NormalizedKline = {
  symbol: string;
  interval: KlineInterval;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** True when the candle is confirmed (closed). */
  confirmed: boolean;
};

export type NormalizedTrade = {
  symbol: string;
  price: number;
  ts: number;
};

export type WsSubscriptionOptions = {
  klineSymbols: string[];
  tickerSymbols?: string[];
  klineIntervals?: KlineInterval[];
  includeTickers?: boolean;
  includePublicTrades?: boolean;
  onKline?: (kline: NormalizedKline) => void;
  onTicker?: (ticker: SymbolTicker) => void;
  onPublicTrade?: (trade: NormalizedTrade) => void;
  onConnectionChange?: (state: WsConnectionState) => void;
  onLog?: (msg: string) => void;
};

export type MarketDataCapabilities = {
  linearPerps: boolean;
  spot: boolean;
  publicTrades: boolean;
};

export interface MarketDataAdapter {
  readonly exchangeId: ExchangeId;
  readonly capabilities: MarketDataCapabilities;

  // REST
  fetchKlines(symbol: string, interval: KlineInterval, limit?: number): Promise<Candle[]>;
  fetchTickers(symbols?: string[]): Promise<SymbolTicker[]>;
  fetchTradablePerpSymbols(): Promise<string[]>;
  rankLiquidUniverse(tickers: SymbolTicker[], minCount: number, maxCount: number): SymbolUniverseItem[];

  // WebSocket lifecycle
  connectWebSocket(options: WsSubscriptionOptions): void;
  disconnectWebSocket(): void;
  updateTickerSymbols(symbols: string[]): void;
  updateKlineSymbols(symbols: string[]): void;
}
