import type { EngineSnapshotCandle, MarketSnapshot } from '@/types/market';

/** Fixed anchor for deterministic demo candles (no live clock). */
const DEMO_ANCHOR_MS = Date.UTC(2026, 3, 29, 14, 0, 0);

function isoAtBarOffset(barIndexFromEnd: number): string {
  const ms = DEMO_ANCHOR_MS - barIndexFromEnd * 15 * 60_000;
  return new Date(ms).toISOString();
}

function buildCandles(
  lastClose: number,
  stepPct: number,
  count: number,
  volBase: number,
): EngineSnapshotCandle[] {
  const out: EngineSnapshotCandle[] = [];
  let close = lastClose * (1 - (stepPct * (count - 1)) / 100);
  for (let i = count - 1; i >= 0; i--) {
    const wick = close * 0.0012;
    const open = close * (1 - stepPct / 400);
    const high = Math.max(open, close) + wick;
    const low = Math.min(open, close) - wick * 0.85;
    const vol = volBase * (0.85 + (i % 4) * 0.05);
    out.push({
      timestamp: isoAtBarOffset(i),
      open,
      high,
      low,
      close,
      volume: vol,
    });
    close = close * (1 + stepPct / 100);
  }
  return out;
}

export const mockMarketSnapshots: MarketSnapshot[] = [
  {
    pair: 'BTC/USDT',
    timeframe: '15m',
    price: 97_250,
    candles: buildCandles(97_250, 0.045, 8, 1_420),
    indicators: {
      ema20: 96_780,
      ema50: 95_920,
      rsi: 54,
      atr: 420,
      volumeRatio: 1.58,
    },
  },
  {
    pair: 'ETH/USDT',
    timeframe: '1h',
    price: 3_428,
    candles: buildCandles(3_428, 0.06, 7, 88_000),
    indicators: {
      ema20: 3_360,
      ema50: 3_490,
      rsi: 71,
      atr: 28,
      volumeRatio: 1.22,
    },
  },
  {
    pair: 'SOL/USDT',
    timeframe: '15m',
    price: 178.6,
    candles: buildCandles(178.6, 0.08, 8, 2.1e6),
    indicators: {
      ema20: 176.2,
      ema50: 171.4,
      rsi: 61,
      atr: 2.4,
      volumeRatio: 1.22,
    },
  },
  {
    pair: 'LINK/USDT',
    timeframe: '5m',
    price: 18.42,
    candles: buildCandles(18.42, 0.05, 6, 410_000),
    indicators: {
      ema20: 18.38,
      ema50: 18.05,
      rsi: 46,
      atr: 0.14,
      volumeRatio: 1.12,
    },
  },
  {
    pair: 'AVAX/USDT',
    timeframe: '4h',
    price: 41.55,
    candles: buildCandles(41.55, 0.07, 10, 620_000),
    indicators: {
      ema20: 42.05,
      ema50: 40.95,
      rsi: 29,
      atr: 0.62,
      volumeRatio: 1.18,
    },
  },
];
