import { describe, expect, it } from 'vitest';
import {
  bybitLinearPositionIdxForOpenSide,
  inferBybitOpenPositionIdx,
  resolveExchangeLinearLeg,
} from '@/lib/exchangeLinearLeg';
import type { PositionItem } from '@/types/integrations';

describe('bybitLinearPositionIdxForOpenSide', () => {
  it('maps hedge indices by side', () => {
    expect(bybitLinearPositionIdxForOpenSide('long', 1)).toBe(1);
    expect(bybitLinearPositionIdxForOpenSide('short', 2)).toBe(2);
    expect(bybitLinearPositionIdxForOpenSide('long', 0)).toBe(0);
  });
});

describe('inferBybitOpenPositionIdx', () => {
  it('uses hedge mode when account has idx 1/2 legs', () => {
    const positions: PositionItem[] = [
      { symbol: 'ETHUSDT', side: 'long', size: 1, entryPrice: 3000, positionIdx: 1 },
    ];
    expect(inferBybitOpenPositionIdx(positions, 'BTCUSDT', 'short')).toBe(2);
    expect(inferBybitOpenPositionIdx(positions, 'BTCUSDT', 'long')).toBe(1);
  });

  it('returns 0 for one-way accounts', () => {
    expect(inferBybitOpenPositionIdx([], 'BTCUSDT', 'long')).toBe(0);
  });

  it('uses account linear mode when positions are empty', () => {
    expect(inferBybitOpenPositionIdx([], 'BTCUSDT', 'long', 'hedge')).toBe(1);
    expect(inferBybitOpenPositionIdx([], 'BTCUSDT', 'short', 'hedge')).toBe(2);
    expect(inferBybitOpenPositionIdx([], 'BTCUSDT', 'long', 'oneWay')).toBe(0);
  });
});

describe('resolveExchangeLinearLeg', () => {
  const positions: PositionItem[] = [
    { symbol: 'BTCUSDT', side: 'long', size: 0.01, entryPrice: 100_000, positionIdx: 1 },
    { symbol: 'BTCUSDT', side: 'short', size: 0.02, entryPrice: 100_000, positionIdx: 2 },
  ];

  it('prefers positionIdx when provided', () => {
    const leg = resolveExchangeLinearLeg(positions, 'BTCUSDT', 'long', 2);
    expect(leg?.side).toBe('short');
    expect(leg?.positionIdx).toBe(2);
  });

  it('falls back to side match', () => {
    const leg = resolveExchangeLinearLeg(positions, 'BTCUSDT', 'short');
    expect(leg?.positionIdx).toBe(2);
  });
});
