import { describe, it, expect } from 'vitest';
import { runScannerPipeline } from '@/engine/scannerPipeline';
import { buildScannerLabFixtureInput } from '@/engine/scannerFixtures';
import { replayLifecycleOnCandles } from '@/engine/scannerReplay';
import type { Candle } from '@/types/market';

const BASE_TS = 1_700_000_000_000;
const INTERVAL_MS = 15 * 60 * 1000;

function makeCandle(i: number, close: number): Candle {
  return {
    ts: BASE_TS + i * INTERVAL_MS,
    open: close - 0.2,
    high: close + 0.5,
    low: close - 0.5,
    close,
    volume: 1200,
    isClosed: true,
  };
}

describe('scannerReplay', () => {
  it('advances lifecycle states across sequential closed candles', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 80; i++) candles.push(makeCandle(i, 109.5));
    candles.push(makeCandle(80, 111));
    for (let i = 81; i < 86; i++) candles.push(makeCandle(i, 111));

    const replay = replayLifecycleOnCandles({
      candles,
      setupType: 'breakout',
      side: 'long',
      setupScore: 75,
    });
    expect(replay.steps.length).toBeGreaterThan(0);
    expect(replay.final).not.toBeNull();
    const states = new Set(replay.steps.map((s) => s.state));
    expect(states.has('triggered') || states.has('ready') || states.has('developing')).toBe(true);
  });
});

describe('runScannerPipeline (live path)', () => {
  it('produces deterministic candidates from fixtures', () => {
    const market = buildScannerLabFixtureInput();
    const first = runScannerPipeline({ marketBySymbol: market, filterConfig: { minSetupScore: 50 } });
    const second = runScannerPipeline({
      marketBySymbol: market,
      previousState: first.nextState,
      filterConfig: { minSetupScore: 50 },
    });
    expect(first.allCandidates.length).toBeGreaterThan(0);
    expect(second.acceptedSignals.length).toBeLessThanOrEqual(first.acceptedSignals.length);
  });

  it('uses buildSignalFromMarket timing metadata when available', () => {
    const market = buildScannerLabFixtureInput();
    const out = runScannerPipeline({ marketBySymbol: market, filterConfig: { minSetupScore: 40 } });
    const withTiming = out.allCandidates.filter((c) => c.timingState != null);
    expect(withTiming.length).toBeGreaterThan(0);
  });
});
