/**
 * Regression test for the paired-fallback bug: when an open position has no real
 * exchange stop-loss AND no real take-profit, ensureStopForOpenPosition and
 * ensureTargetForOpenPosition were called independently per leg. Each only checks
 * that a stale plan-derived value sits on the correct side of the real entry —
 * not whether its magnitude has any relationship to that entry. That let a stale,
 * unrelated target (computed against a completely different reference price)
 * pass through unchanged on one leg while the other leg fell back to the tiny
 * synthetic default, pairing e.g. a razor-thin stop with a huge stale target and
 * producing an absurd R:R (seen live as "Stop -0.20% / Tgt +48.40%" / "R:R
 * 242.02 : 1"). The fix: derive both legs together from deriveLevels when neither
 * is real exchange data, so they always describe one coherent, self-consistent
 * plan.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveLevels,
  ensureStopForOpenPosition,
  ensureTargetForOpenPosition,
} from '@/lib/tradeViewFromSignal';

describe('deriveLevels — paired stop/target are always self-consistent', () => {
  it('produces a stop/target pair whose ratio matches the fixed reward multiple, for either side', () => {
    const entry = 1.06;
    for (const side of ['long', 'short'] as const) {
      const { stop, target } = deriveLevels(side, entry, 60);
      const stopMovePct = Math.abs((stop - entry) / entry);
      const targetMovePct = Math.abs((target - entry) / entry);
      expect(targetMovePct / stopMovePct).toBeCloseTo(1.45, 6);
    }
  });

  it('demonstrates the bug: independently validated legs can pair a tiny fallback stop with a huge stale target', () => {
    const realEntry = 1.06;
    // A stale plan target computed against a totally different reference price —
    // still on the correct side of realEntry (short: target < entry), but 48% away.
    const staleTarget = 0.545;
    // A stale plan stop that fails the "correct side" check for a short (should be > entry).
    const staleStop = 1.02;

    const stop = ensureStopForOpenPosition('short', realEntry, staleStop, 60);
    const target = ensureTargetForOpenPosition('short', realEntry, staleTarget, 60);

    const stopMovePct = Math.abs((stop - realEntry) / realEntry);
    const targetMovePct = Math.abs((target - realEntry) / realEntry);
    const impliedRR = targetMovePct / stopMovePct;

    // The stale target survives unchanged (still "valid" by the side-only check) while
    // the stop falls back to deriveLevels' tiny synthetic default — an absurd, unpaired R:R.
    expect(target).toBeCloseTo(staleTarget, 6);
    expect(impliedRR).toBeGreaterThan(50);
  });
});
