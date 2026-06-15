import { describe, it, expect } from 'vitest';
import {
  breakoutScenario5m,
  overextendedScenario5m,
  pullbackScenario5m,
  scenarioThroughTrigger,
  SCENARIO_TRIGGER_CANDLE,
} from '@/data/scannerLabCandles';
import { breakoutPressureDetector } from '@/lib/detectors/long';
import { pullbackContinuationDetector } from '@/lib/detectors/long';
import { overextendedDetector } from '@/lib/detectors/long';
import {
  MIN_ENGINE_BARS,
  runScannerLabEngineEvaluations,
  isLabTimingTriggered,
} from '@/lib/scannerLabEngineAdapter';
import { playbackCandlesToEngine } from '@/lib/scannerLabEngineAdapter';
import { calculateSetupScore } from '@/lib/setupScore';
import { defaultScannerFilterConfig, thresholdsForRegime } from '@/lib/scannerEngineConfig';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';
import type { PlaybackCandle } from '@/types/market';

function scanTimingTriggers(candles: PlaybackCandle[]) {
  const minScore = defaultScannerFilterConfig().minSetupScore;
  const hits: Array<{ bar: number; setupType: string; score: number }> = [];
  let lifecycleRegistry: Partial<Record<'breakout' | 'pullback' | 'overextended', CandidateLifecycle>> = {};
  for (let i = MIN_ENGINE_BARS; i <= candles.length; i += 1) {
    const visible = candles.slice(0, i);
    const { evaluations } = runScannerLabEngineEvaluations('LAB', visible, 'neutral', lifecycleRegistry);
    for (const e of evaluations) {
      if (e.lifecycle) lifecycleRegistry[e.setupType] = e.lifecycle;
      if (!e.timingTriggered || !e.scoreBreakdown) continue;
      const score = calculateSetupScore(e.scoreBreakdown);
      if (score >= minScore) {
        hits.push({ bar: i, setupType: e.setupType, score });
      }
    }
  }
  return hits;
}

function replayThroughTrigger(
  key: keyof typeof SCENARIO_TRIGGER_CANDLE,
  symbol: string,
) {
  const candles = scenarioThroughTrigger(key);
  let lifecycleRegistry: Partial<Record<'breakout' | 'pullback' | 'overextended', CandidateLifecycle>> = {};
  for (let i = MIN_ENGINE_BARS; i <= candles.length; i += 1) {
    const { evaluations } = runScannerLabEngineEvaluations(
      symbol,
      candles.slice(0, i),
      'neutral',
      lifecycleRegistry,
    );
    for (const e of evaluations) {
      if (e.lifecycle) lifecycleRegistry[e.setupType] = e.lifecycle;
    }
  }
  return runScannerLabEngineEvaluations(symbol, candles, 'neutral', lifecycleRegistry);
}

describe('scanner lab scenario fixtures', () => {
  const t = thresholdsForRegime('neutral');
  const minScore = defaultScannerFilterConfig().minSetupScore;

  it('each scenario has enough bars for warmup, trigger, and outcome tail', () => {
    expect(breakoutScenario5m.length).toBeGreaterThan(SCENARIO_TRIGGER_CANDLE.breakout + 4);
    expect(pullbackScenario5m.length).toBeGreaterThan(SCENARIO_TRIGGER_CANDLE.pullback + 4);
    expect(overextendedScenario5m.length).toBeGreaterThan(SCENARIO_TRIGGER_CANDLE.overextended + 4);
  });

  it('breakout scenario detector qualifies on the trigger bar', () => {
    const engine = playbackCandlesToEngine(scenarioThroughTrigger('breakout'));
    const out = breakoutPressureDetector(engine, t);
    expect(out).not.toBeNull();
    expect(calculateSetupScore(out!.breakdown)).toBeGreaterThanOrEqual(minScore);
  });

  it('breakout trigger bar fires timing trigger', () => {
    const { evaluations } = replayThroughTrigger('breakout', 'SOLUSDT');
    const row = evaluations.find((e) => e.setupType === 'breakout');
    expect(row?.detectorQualified).toBe(true);
    expect(row?.timingTriggered).toBe(true);
  });

  it('pullback scenario emits a pullback timing trigger after warmup', () => {
    const engine = playbackCandlesToEngine(scenarioThroughTrigger('pullback'));
    const out = pullbackContinuationDetector(engine, t);
    expect(out).not.toBeNull();
    expect(calculateSetupScore(out!.breakdown)).toBeGreaterThanOrEqual(minScore);
    const hits = scanTimingTriggers(pullbackScenario5m);
    expect(hits.some((h) => h.setupType === 'pullback')).toBe(true);
  });

  it('overextended scenario detector qualifies on the trigger bar', () => {
    const engine = playbackCandlesToEngine(scenarioThroughTrigger('overextended'));
    const out = overextendedDetector(engine, t);
    expect(out).not.toBeNull();
    expect(calculateSetupScore(out!.breakdown)).toBeGreaterThanOrEqual(minScore);
  });

  it('overextended trigger bar advances timing lifecycle', () => {
    const { evaluations } = replayThroughTrigger('overextended', 'DOGEUSDT');
    const row = evaluations.find((e) => e.setupType === 'overextended');
    expect(row?.detectorQualified).toBe(true);
    expect(row?.timingState).toBeDefined();
    expect(['developing', 'ready', 'triggered']).toContain(row?.timingState);
  });

  it('pullback trigger bar reaches timing triggered in lab evaluations', () => {
    const { evaluations } = runScannerLabEngineEvaluations(
      'ETHUSDT',
      scenarioThroughTrigger('pullback'),
      'neutral',
    );
    const pullback = evaluations.find((e) => e.setupType === 'pullback');
    expect(pullback?.detectorQualified).toBe(true);
    expect(pullback?.timingTriggered).toBe(true);
    expect(pullback?.lifecycle && isLabTimingTriggered(pullback.lifecycle)).toBe(true);
  });
});
