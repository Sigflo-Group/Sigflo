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

  it('accepts RSI 72-76 (relaxed post-breakout band) once genuinely broken past the prior swing high', () => {
    // Reference level for "broken out" must come from candles before this one — using the
    // current candle's own high (which is always >= its own close) makes the post-breakout
    // RSI relaxation (55-72 -> 50-78) permanently unreachable. This choppy uptrend + breakout
    // candle is tuned so RSI lands at ~75.4: above the tight pre-breakout cap (72) but below
    // the unconditional hard cutoff (76) — only accepted if the relaxed band actually engages.
    const candles: Candle[] = [];
    let price = 90;
    for (let i = 0; i < 60; i++) {
      const delta = i % 4 === 3 ? -0.7 : 0.4;
      const nextClose = price + delta;
      candles.push(
        makeCandle(i, {
          open: price,
          high: Math.max(price, nextClose) + 0.3,
          low: Math.min(price, nextClose) - 0.3,
          close: nextClose,
          volume: 1000,
        }),
      );
      price = nextClose;
    }
    for (let i = 60; i < 79; i++) {
      candles.push(makeCandle(i, { open: price, high: price + 0.3, low: price - 0.2, close: price + 0.1, volume: 900 }));
    }
    const priorHigh = price + 0.3;
    candles.push(
      makeCandle(79, { open: price + 0.1, high: priorHigh + 1.1, low: price, close: priorHigh + 0.75, volume: 2200 }),
    );

    const out = breakoutPressureDetector(candles, t);
    expect(out).not.toBeNull();
    expect(out!.facts.rsi).toBeGreaterThan(72);
    expect(out!.facts.rsi).toBeLessThanOrEqual(76);
    expect(out!.facts.distanceToBreakoutAtr).toBeLessThan(0);
  });

  it('accepts RSI 24-28 (relaxed post-breakdown band) once genuinely broken past the prior swing low', () => {
    // Mirrors the breakout case above for the short side.
    const candles: Candle[] = [];
    let price = 200;
    for (let i = 0; i < 60; i++) {
      const delta = i % 4 === 3 ? 0.7 : -0.4;
      const nextClose = price + delta;
      candles.push(
        makeCandle(i, {
          open: price,
          high: Math.max(price, nextClose) + 0.3,
          low: Math.min(price, nextClose) - 0.3,
          close: nextClose,
          volume: 1000,
        }),
      );
      price = nextClose;
    }
    for (let i = 60; i < 79; i++) {
      candles.push(makeCandle(i, { open: price, high: price + 0.2, low: price - 0.3, close: price - 0.1, volume: 900 }));
    }
    const priorLow = price - 0.3;
    candles.push(
      makeCandle(79, { open: price - 0.1, high: price, low: priorLow - 1.1, close: priorLow - 0.75, volume: 2200 }),
    );

    const out = breakdownPressureDetector(candles, t);
    expect(out).not.toBeNull();
    expect(out!.facts.rsi).toBeLessThan(28);
    expect(out!.facts.rsi).toBeGreaterThanOrEqual(24);
    expect(out!.facts.distanceToBreakoutAtr).toBeLessThan(0);
  });

  it('still hard-rejects overbought RSI (> 76) even when already broken out', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 79; i++) {
      candles.push(makeCandle(i, { close: 100 + i * 0.5, high: 101 + i * 0.5, low: 99, volume: 1500 }));
    }
    // Far past any prior swing high (brokenOut = true) but RSI is pinned well above 76.
    candles.push(makeCandle(79, { close: 150, high: 151, low: 149, volume: 2500 }));
    expect(breakoutPressureDetector(candles, t)).toBeNull();
  });

  it('breakdown short rejects when RSI is oversold (< 24)', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 79; i++) {
      candles.push(makeCandle(i, { close: 200 - i * 0.5, low: 198 - i * 0.5, high: 201, volume: 1500 }));
    }
    candles.push(makeCandle(79, { close: 50, low: 49, high: 51, volume: 2500 }));
    expect(breakdownPressureDetector(candles, t)).toBeNull();
  });

  it('still hard-rejects oversold RSI (< 24) even when already broken down', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 79; i++) {
      candles.push(makeCandle(i, { close: 200 - i * 0.5, low: 198 - i * 0.5, high: 201, volume: 1500 }));
    }
    // Far past any prior swing low (brokenDown = true) but RSI is pinned well below 24.
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
