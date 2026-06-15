import { describe, it, expect } from 'vitest';
import {
  breakoutScenario5m,
  overextendedScenario5m,
  pullbackScenario5m,
} from '@/data/scannerLabCandles';
import { breakoutPressureDetector } from '@/lib/detectors/long';
import { pullbackContinuationDetector } from '@/lib/detectors/long';
import { overextendedDetector } from '@/lib/detectors/long';
import { MIN_ENGINE_BARS, runScannerLabEngineEvaluations } from '@/lib/scannerLabEngineAdapter';
import { playbackCandlesToEngine } from '@/lib/scannerLabEngineAdapter';
import { calculateSetupScore } from '@/lib/setupScore';
import { defaultScannerFilterConfig, thresholdsForRegime } from '@/lib/scannerEngineConfig';
import type { PlaybackCandle } from '@/types/market';

function scanScenario(candles: PlaybackCandle[]) {
  const minScore = defaultScannerFilterConfig().minSetupScore;
  const hits: Array<{ bar: number; setupType: string; score: number }> = [];
  for (let i = MIN_ENGINE_BARS; i <= candles.length; i += 1) {
    const visible = candles.slice(0, i);
    const { evaluations } = runScannerLabEngineEvaluations('LAB', visible);
    for (const e of evaluations) {
      if (!e.triggered || !e.scoreBreakdown) continue;
      const score = calculateSetupScore(e.scoreBreakdown);
      if (score >= minScore) {
        hits.push({ bar: i, setupType: e.setupType, score });
      }
    }
  }
  return hits;
}

describe('scanner lab scenario fixtures', () => {
  const t = thresholdsForRegime('neutral');
  const minScore = defaultScannerFilterConfig().minSetupScore;

  it('each scenario has enough bars for warmup and a fire moment', () => {
    expect(breakoutScenario5m.length).toBeGreaterThan(MIN_ENGINE_BARS);
    expect(pullbackScenario5m.length).toBeGreaterThan(MIN_ENGINE_BARS);
    expect(overextendedScenario5m.length).toBeGreaterThan(MIN_ENGINE_BARS);
  });

  it('breakout scenario emits a breakout signal after warmup', () => {
    const engine = playbackCandlesToEngine(breakoutScenario5m);
    const out = breakoutPressureDetector(engine, t);
    expect(out).not.toBeNull();
    expect(calculateSetupScore(out!.breakdown)).toBeGreaterThanOrEqual(minScore);
    const hits = scanScenario(breakoutScenario5m);
    expect(hits.some((h) => h.setupType === 'breakout')).toBe(true);
  });

  it('pullback scenario emits a pullback signal after warmup', () => {
    const engine = playbackCandlesToEngine(pullbackScenario5m);
    const out = pullbackContinuationDetector(engine, t);
    expect(out).not.toBeNull();
    expect(calculateSetupScore(out!.breakdown)).toBeGreaterThanOrEqual(minScore);
    const hits = scanScenario(pullbackScenario5m);
    expect(hits.some((h) => h.setupType === 'pullback')).toBe(true);
  });

  it('overextended scenario emits an overextended signal after warmup', () => {
    const engine = playbackCandlesToEngine(overextendedScenario5m);
    const out = overextendedDetector(engine, t);
    expect(out).not.toBeNull();
    expect(calculateSetupScore(out!.breakdown)).toBeGreaterThanOrEqual(minScore);
    const hits = scanScenario(overextendedScenario5m);
    expect(hits.some((h) => h.setupType === 'overextended')).toBe(true);
  });
});
