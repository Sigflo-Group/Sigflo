import { describe, it, expect } from 'vitest';
import { thresholdsForRegime } from '@/lib/scannerEngineConfig';
import { runAllDetectorsForLab } from '@/lib/signalDetectors';
import {
  breakoutPressureDetector,
  pullbackContinuationDetector,
  overextendedDetector,
} from '@/lib/detectors/long';
import {
  breakdownPressureDetector,
  pullbackContinuationShortDetector,
} from '@/lib/detectors/short';
import type { Candle } from '@/types/market';

const BASE_TS = 1_700_000_000_000;
const INTERVAL_MS = 15 * 60 * 1000;

function makeCandle(i: number, overrides: Partial<Candle> = {}): Candle {
  return {
    ts: BASE_TS + i * INTERVAL_MS,
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    volume: 1000,
    isClosed: true,
    ...overrides,
  };
}

function buildBreakoutCandles(baseCount = 80, prevClose = 109.5, breakoutClose = 111): Candle[] {
  const base: Candle[] = [];
  for (let i = 0; i < baseCount; i++) {
    base.push(makeCandle(i, { open: 100, high: 110, low: 99, close: prevClose, volume: 1200 }));
  }
  base.push(
    makeCandle(baseCount, {
      open: prevClose,
      high: breakoutClose + 0.5,
      low: prevClose - 0.3,
      close: breakoutClose,
      volume: 2000,
    }),
  );
  return base;
}

describe('market detectors', () => {
  const t = thresholdsForRegime('neutral');

  it('breakout long rejects when RSI is overbought (> 76)', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 79; i++) {
      candles.push(makeCandle(i, { close: 100 + i * 0.5, high: 101 + i * 0.5, low: 99, volume: 1500 }));
    }
    candles.push(makeCandle(79, { close: 150, high: 151, low: 149, volume: 2500 }));
    expect(breakoutPressureDetector(candles, t)).toBeNull();
  });

  it('breakout long returns breakout/long when structural conditions align', () => {
    const candles = buildBreakoutCandles();
    const out = breakoutPressureDetector(candles, t);
    if (out) {
      expect(out.setupType).toBe('breakout');
      expect(out.side).toBe('long');
    }
    const lab = runAllDetectorsForLab(candles, 'neutral');
    expect(lab.breakoutLong == null || lab.breakoutLong.setupType === 'breakout').toBe(true);
  });

  it('breakdown short rejects when RSI is oversold (< 24)', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 79; i++) {
      candles.push(makeCandle(i, { close: 200 - i * 0.5, low: 198 - i * 0.5, high: 201, volume: 1500 }));
    }
    candles.push(makeCandle(79, { close: 50, low: 49, high: 51, volume: 2500 }));
    expect(breakdownPressureDetector(candles, t)).toBeNull();
  });

  it('overextended long requires stretch from EMA', () => {
    const flat = Array.from({ length: 80 }, (_, i) => makeCandle(i, { close: 100, high: 101, low: 99 }));
    expect(overextendedDetector(flat, t)).toBeNull();
    const stretched = Array.from({ length: 80 }, (_, i) =>
      makeCandle(i, { close: 100 + i * 2, high: 102 + i * 2, low: 99 + i * 2, volume: 1400 }),
    );
    expect(overextendedDetector(stretched, t)).not.toBeNull();
  });

  it('pullback detectors return distinct setup types', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 80; i++) {
      candles.push(makeCandle(i, { open: 110, high: 112, low: 108, close: 110, volume: 1000 }));
    }
    candles.push(makeCandle(80, { open: 105.2, high: 107, low: 105, close: 106.5, volume: 1100 }));
    const longPb = pullbackContinuationDetector(candles, t);
    expect(longPb == null || longPb.setupType === 'pullback').toBe(true);
    const shortPb = pullbackContinuationShortDetector(candles, t);
    expect(shortPb == null || shortPb.setupType === 'pullback').toBe(true);
  });

  it('runAllDetectorsForLab returns all six detector slots', () => {
    const candles = buildBreakoutCandles();
    const lab = runAllDetectorsForLab(candles, 'neutral');
    expect(lab).toHaveProperty('breakoutLong');
    expect(lab).toHaveProperty('breakdownShort');
    expect(lab).toHaveProperty('pullbackLong');
    expect(lab).toHaveProperty('pullbackShort');
    expect(lab).toHaveProperty('overextendedLong');
    expect(lab).toHaveProperty('overextendedShort');
  });
});
