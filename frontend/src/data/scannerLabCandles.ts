import type { PlaybackCandle } from '@/types/market';
import { MIN_ENGINE_BARS } from '@/lib/scannerLabEngineAdapter';

const START_TS = Date.UTC(2026, 0, 5, 12, 0, 0);
const STEP_MS = 5 * 60 * 1000;

function c(
  i: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
): PlaybackCandle {
  return {
    timestamp: START_TS + i * STEP_MS,
    open,
    high,
    low,
    close,
    volume,
    isClosed: true,
  };
}

/** Breakout: choppy flat base (RSI ~60), tight coil under resistance, volume push into breakout zone. */
function buildBreakoutLabSeries(): PlaybackCandle[] {
  const bars: PlaybackCandle[] = [];
  for (let i = 0; i < 64; i += 1) {
    const close = 108.5 + Math.sin(i / 2.5) * 0.35;
    bars.push(c(i, close - 0.06, close + 0.28, close - 0.28, close, 1100));
  }
  for (let i = 0; i < 8; i += 1) {
    const close = 108.95 + (i % 2) * 0.03;
    bars.push(c(64 + i, close - 0.04, 109.14, 108.82, close, 1040));
  }
  bars.push(c(72, 108.94, 109.16, 108.92, 109.1, 2300));
  return bars;
}

/** Pullback: steady uptrend, shallow dip into EMA zone, bounce on last bar. */
function buildPullbackLabSeries(): PlaybackCandle[] {
  const bars: PlaybackCandle[] = [];
  const baseCount = MIN_ENGINE_BARS + 16;
  for (let i = 0; i < baseCount; i += 1) {
    bars.push(c(i, 110, 112, 108, 110, 1000));
  }
  let price = 110;
  for (let i = 0; i < 4; i += 1) {
    const close = price + 0.45;
    bars.push(c(baseCount + i, price, close + 0.25, price - 0.05, close, 1500));
    price = close;
  }
  for (let i = 0; i < 3; i += 1) {
    const close = price - 0.55;
    bars.push(c(baseCount + 4 + i, price, price + 0.1, close - 0.25, close, 880));
    price = close;
  }
  const bounce = price + 0.45;
  bars.push(c(baseCount + 7, price, bounce + 0.2, price - 0.15, bounce, 1050));
  return bars;
}

/** Overextended: flat base then parabolic stretch with hot RSI. */
function buildOverextendedLabSeries(): PlaybackCandle[] {
  const bars: PlaybackCandle[] = [];
  const flatCount = MIN_ENGINE_BARS + 10;
  for (let i = 0; i < flatCount; i += 1) {
    const close = 50 + (i % 4) * 0.04;
    bars.push(c(i, close - 0.05, close + 0.35, close - 0.35, close, 1100));
  }
  let price = 50.2;
  for (let i = flatCount; i < flatCount + 12; i += 1) {
    const step = 1.6 + (i - flatCount) * 0.35;
    const close = price + step;
    bars.push(c(i, price, close + 0.55, price - 0.15, close, 1800 + i * 120));
    price = close;
  }
  return bars;
}

export const breakoutScenario5m = buildBreakoutLabSeries();
export const pullbackScenario5m = buildPullbackLabSeries();
export const overextendedScenario5m = buildOverextendedLabSeries();
