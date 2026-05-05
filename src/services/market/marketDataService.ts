import { ema, rsi } from '@/lib/indicators';
import { fetchKlines as bybitFetchKlines } from '@/services/bybit/client';
import type { Candle, EngineSnapshotCandle, KlineInterval, MarketSnapshot } from '@/types/market';

/** Intervals supported by {@link getKlines} (Bybit linear kline). */
export type KlineFetchInterval = '5m' | '15m' | '1h';

function pairToLinearSymbol(pair: string): string {
  const p = pair.trim().toUpperCase().replace(/\s+/g, '');
  if (!p) return '';
  if (p.includes('/')) return p.replace('/', '');
  if (/USDT$/i.test(p) || /USDC$/i.test(p)) return p;
  return `${p}USDT`;
}

function displayPairFromSymbol(symbol: string, originalPair: string): string {
  const o = originalPair.trim();
  if (o.includes('/')) return o;
  const sym = symbol.toUpperCase();
  const base = sym.replace(/USDT$/i, '').replace(/USDC$/i, '');
  if (base && base !== sym) return `${base} / USDT`;
  return sym;
}

function uiIntervalToBybit(interval: KlineFetchInterval): KlineInterval {
  switch (interval) {
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '1h':
      return '60';
  }
}

function snapshotTimeframeToBybit(tf: MarketSnapshot['timeframe']): KlineInterval {
  switch (tf) {
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '1h':
      return '60';
    case '4h':
      return '240';
  }
}

function candlesToEngineCandles(candles: Candle[]): EngineSnapshotCandle[] {
  return candles.map((c) => ({
    timestamp: new Date(c.ts).toISOString(),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

/**
 * Linear USDT perp klines from Bybit public REST (`/v5/market/kline`, category=linear).
 */
export async function getKlines(pair: string, interval: KlineFetchInterval, limit: number): Promise<Candle[]> {
  const symbol = pairToLinearSymbol(pair);
  if (!symbol) return [];
  const capped = Math.max(1, Math.min(1000, Math.floor(limit)));
  return bybitFetchKlines(symbol, uiIntervalToBybit(interval), capped);
}

/**
 * Latest market snapshot: klines, last price as last close, and lightweight indicators.
 */
export async function getMarketSnapshot(
  pair: string,
  timeframe: MarketSnapshot['timeframe'],
  limit = 50,
): Promise<MarketSnapshot> {
  const symbol = pairToLinearSymbol(pair);
  if (!symbol) {
    return {
      pair: pair.trim() || '—',
      timeframe,
      price: 0,
      candles: [],
      indicators: {},
    };
  }

  const capped = Math.max(1, Math.min(1000, Math.floor(limit)));
  const candles = await bybitFetchKlines(symbol, snapshotTimeframeToBybit(timeframe), capped);
  const displayPair = displayPairFromSymbol(symbol, pair);

  if (candles.length === 0) {
    return {
      pair: displayPair,
      timeframe,
      price: 0,
      candles: [],
      indicators: {},
    };
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const lastClose = closes[closes.length - 1] ?? 0;
  const lastVol = volumes[volumes.length - 1] ?? 0;
  const volAvg = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;

  const ema20Series = ema(closes, 20);
  const ema50Series = ema(closes, 50);
  const rsiSeries = rsi(closes, 14);

  const ema20 = ema20Series[ema20Series.length - 1];
  const ema50 = ema50Series[ema50Series.length - 1];
  const rsiLast = rsiSeries[rsiSeries.length - 1];

  const volumeRatio = volAvg > 0 && Number.isFinite(lastVol) ? lastVol / volAvg : undefined;

  return {
    pair: displayPair,
    timeframe,
    price: lastClose,
    candles: candlesToEngineCandles(candles),
    indicators: {
      ema20: Number.isFinite(ema20) ? ema20 : undefined,
      ema50: Number.isFinite(ema50) ? ema50 : undefined,
      rsi: Number.isFinite(rsiLast) ? rsiLast : undefined,
      volumeRatio: volumeRatio !== undefined && Number.isFinite(volumeRatio) ? volumeRatio : undefined,
    },
  };
}
