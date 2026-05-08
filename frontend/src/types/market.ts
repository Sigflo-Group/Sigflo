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

/**
 * Demo / engine-output OHLCV (ISO timestamps). Separate from chart {@link Candle} (`ts` in ms).
 * Used by the deterministic frontend engine pipeline (no live exchange wiring).
 */
export type EngineSnapshotCandle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketSnapshot = {
  pair: string;
  timeframe: '5m' | '15m' | '1h' | '4h';
  price: number;
  candles: EngineSnapshotCandle[];
  /**
   * Detector-quality snapshots should include all of ema20, ema50, rsi, atr, volumeRatio.
   * ATR is used for entry / invalidation / target bands in engine detectors.
   */
  indicators: {
    ema20?: number;
    ema50?: number;
    rsi?: number;
    atr?: number;
    volumeRatio?: number;
  };
};
