import { describe, it, expect } from 'vitest';
import { scenarioThroughTrigger } from '@/data/scannerLabCandles';
import { buildAllSignalsFromMarket } from '@/lib/signalDetectors';
import { deriveMarketStatus, isSignalTimingTriggered } from '@/lib/marketScannerRows';
import { playbackCandlesToEngine } from '@/lib/scannerLabEngineAdapter';

const stubTicker = {
  symbol: 'LABUSDT',
  lastPrice: 109.85,
  high24h: 110,
  low24h: 108,
  volume24h: 1_000_000,
  turnover24h: 50_000_000,
  price24hPcnt: 0.02,
};

describe('live signal parity with Scanner Lab breakout fixture', () => {
  it('produces a triggered breakout on the lab fire candle window', () => {
    const candles15m = playbackCandlesToEngine(scenarioThroughTrigger('breakout'));
    const built = buildAllSignalsFromMarket({
      symbol: 'LABUSDT',
      exchange: 'Bybit',
      ticker: stubTicker,
      candles15m,
      regime: 'neutral',
    });
    const breakout = built.find((b) => b.signal.setupType === 'breakout');
    expect(breakout).toBeDefined();
    expect(breakout!.signal.setupScore).toBeGreaterThanOrEqual(45);
    expect(isSignalTimingTriggered(breakout!.signal)).toBe(true);
    expect(deriveMarketStatus(breakout!.signal)).toBe('triggered');
  });
});
