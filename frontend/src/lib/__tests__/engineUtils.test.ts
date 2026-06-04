import { describe, it, expect } from 'vitest';
import { signalPairToLinearKey, signalEmitKey, emptyIntervalCandles, upsertCandle } from '@/lib/engineUtils';
import type { Candle } from '@/types/market';

describe('signalPairToLinearKey', () => {
  it('converts BTCUSDT to BTCUSDT', () => {
    expect(signalPairToLinearKey('BTCUSDT')).toBe('BTCUSDT');
  });

  it('converts btcusdt to BTCUSDT', () => {
    expect(signalPairToLinearKey('btcusdt')).toBe('BTCUSDT');
  });

  it('converts ETH/USDT to ETHUSDT', () => {
    expect(signalPairToLinearKey('ETH/USDT')).toBe('ETHUSDT');
  });

  it('converts solusdt to SOLUSDT', () => {
    expect(signalPairToLinearKey('solusdt')).toBe('SOLUSDT');
  });

  it('returns BTCUSDT for empty-ish input', () => {
    expect(signalPairToLinearKey('')).toBe('BTCUSDT');
  });

  it('strips non-alphanumeric characters', () => {
    expect(signalPairToLinearKey('1000PEPEUSDT')).toBe('1000PEPEUSDT');
  });
});

describe('signalEmitKey', () => {
  it('builds a colon-delimited key', () => {
    expect(signalEmitKey('BTCUSDT', 'breakout', 'long')).toBe('BTCUSDT:breakout:long');
  });

  it('handles short side', () => {
    expect(signalEmitKey('ETHUSDT', 'pullback', 'short')).toBe('ETHUSDT:pullback:short');
  });
});

describe('emptyIntervalCandles', () => {
  it('returns all seven interval keys', () => {
    const candles = emptyIntervalCandles();
    expect(Object.keys(candles)).toEqual(['1', '5', '15', '60', '240', 'D', 'W']);
  });

  it('each interval starts as an empty array', () => {
    const candles = emptyIntervalCandles();
    for (const key of Object.keys(candles)) {
      expect(candles[key as keyof typeof candles]).toEqual([]);
    }
  });
});

describe('upsertCandle', () => {
  const base: Candle = { ts: 1000, open: 100, high: 101, low: 99, close: 100, volume: 1000, isClosed: true };

  function c(ts: number, overrides: Partial<Candle> = {}): Candle {
    return { ...base, ts, ...overrides };
  }

  it('appends a new candle after the last', () => {
    const store = [c(1000), c(2000)];
    const result = upsertCandle(store, c(3000));
    expect(result).toHaveLength(3);
    expect(result[2].ts).toBe(3000);
  });

  it('replaces the last candle when ts matches', () => {
    const store = [c(1000), c(2000, { close: 101 })];
    const result = upsertCandle(store, c(2000, { close: 102 }));
    expect(result).toHaveLength(2);
    expect(result[1].close).toBe(102);
  });

  it('inserts an out-of-order candle at the correct position', () => {
    const store = [c(1000), c(3000), c(4000)];
    const result = upsertCandle(store, c(2000));
    expect(result).toHaveLength(4);
    expect(result[1].ts).toBe(2000);
  });

  it('replaces an out-of-order candle with same ts', () => {
    const store = [c(1000), c(2000, { close: 101 }), c(3000)];
    const result = upsertCandle(store, c(2000, { close: 105 }));
    expect(result).toHaveLength(3);
    expect(result[1].close).toBe(105);
  });

  it('caps store at 240 candles', () => {
    const store: Candle[] = [];
    for (let i = 0; i < 240; i++) store.push(c(i * 1000));
    const result = upsertCandle(store, c(240 * 1000));
    expect(result).toHaveLength(240);
    expect(result[0].ts).toBe(1000);
    expect(result[239].ts).toBe(240 * 1000);
  });

  it('handles empty store', () => {
    const result = upsertCandle([], c(1000));
    expect(result).toHaveLength(1);
    expect(result[0].ts).toBe(1000);
  });

  it('does not mutate the original array', () => {
    const store = [c(1000), c(2000)];
    const originalLength = store.length;
    upsertCandle(store, c(3000));
    expect(store).toHaveLength(originalLength);
  });
});
