import { describe, it, expect } from 'vitest';
import { breakoutScenario5m } from '@/data/scannerLabCandles';
import { runScannerLabEngineEvaluations } from '@/lib/scannerLabEngineAdapter';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';

describe('breakout scenario cross-contamination', () => {
  it('does not emit pullback timing trigger before breakout fire bar', () => {
    const lifecycleRegistry: Partial<Record<'breakout' | 'pullback' | 'overextended', CandidateLifecycle>> = {};
    const falsePullbacks: number[] = [];
    for (let i = 60; i <= 71; i += 1) {
      const { evaluations } = runScannerLabEngineEvaluations(
        'SOLUSDT',
        breakoutScenario5m.slice(0, i),
        'neutral',
        lifecycleRegistry,
      );
      for (const e of evaluations) {
        if (e.lifecycle) lifecycleRegistry[e.setupType] = e.lifecycle;
        if (e.setupType === 'pullback' && e.timingTriggered) falsePullbacks.push(i);
      }
    }
    expect(falsePullbacks).toEqual([]);
  });
});
