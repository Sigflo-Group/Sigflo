import { describe, it, expect } from 'vitest';
import { pullbackScenario5m, scenarioThroughTrigger } from '@/data/scannerLabCandles';
import { buildAllSignalsFromMarket } from '@/lib/signalDetectors';
import { deriveMarketStatus } from '@/lib/marketScannerRows';
import { playbackCandlesToEngine, MIN_ENGINE_BARS } from '@/lib/scannerLabEngineAdapter';
import { evaluateTimingLifecycle } from '@/lib/timingLifecycle';
import { pullbackContinuationDetector } from '@/lib/detectors/long';
import { thresholdsForRegime } from '@/lib/scannerEngineConfig';
import { calculateSetupScore } from '@/lib/setupScore';

describe('pullback lab timing', () => {
  it('reports lifecycle on each bar from warmup', () => {
    const t = thresholdsForRegime('neutral');
    const rows: string[] = [];
    for (let i = MIN_ENGINE_BARS; i <= pullbackScenario5m.length; i += 1) {
      const engine = playbackCandlesToEngine(pullbackScenario5m.slice(0, i));
      const out = pullbackContinuationDetector(engine, t);
      if (!out) continue;
      const score = calculateSetupScore(out.breakdown);
      const { lifecycle } = evaluateTimingLifecycle({
        setupType: 'pullback',
        side: 'long',
        setupScore: score,
        candles: engine,
      });
      rows.push(
        `bar ${i}: score=${score} state=${lifecycle.state} trigger=${lifecycle.trigger.triggerType} since=${lifecycle.candlesSinceTrigger}`,
      );
    }
    // eslint-disable-next-line no-console
    console.log(rows.join('\n'));
    expect(rows.length).toBeGreaterThan(0);
  });

  it('trigger bar should reach triggered UI status', () => {
    const engine = playbackCandlesToEngine(scenarioThroughTrigger('pullback'));
    const built = buildAllSignalsFromMarket({
      symbol: 'ETHUSDT',
      exchange: 'Bybit',
      ticker: {
        symbol: 'ETHUSDT',
        lastPrice: 111,
        price24hPcnt: 0,
        volume24h: 0,
        turnover24h: 0,
        high24h: 112,
        low24h: 108,
      },
      candles15m: engine,
      regime: 'neutral',
    });
    const pullback = built.find((b) => b.signal.setupType === 'pullback');
    expect(pullback).toBeDefined();
    expect(deriveMarketStatus(pullback!.signal)).toBe('triggered');
  });
});
