/**
 * Regression test: TradePlanCornerStats shows Stop%/Tgt% (via pctToLevel) next to a
 * riskReward ratio computed independently from entry/stop/target. Those two numbers
 * only agree when pctStop/pctTarget are measured from `entry` — measuring them from
 * `lastPrice` instead (the previous bug) makes Tgt%/Stop% silently diverge from the
 * displayed R:R as soon as price moves away from entry.
 */

import { describe, it, expect } from 'vitest';
import { pctToLevel } from '@/lib/tradePlanOverlayGeometry';

describe('pctToLevel — entry-anchored Stop%/Tgt% agree with R:R', () => {
  it('Tgt% / Stop% ratio matches riskReward when measured from entry', () => {
    const entry = 1.06;
    const stop = 1.0635; // short: stop above entry
    const target = 0.545; // short: target well below entry

    const stopMovePct = Math.abs((stop - entry) / entry);
    const targetMovePct = Math.abs((target - entry) / entry);
    const riskReward = targetMovePct / stopMovePct;

    const pctStop = pctToLevel(entry, stop, entry);
    const pctTarget = pctToLevel(entry, target, entry);

    expect(Math.abs(pctTarget) / Math.abs(pctStop)).toBeCloseTo(riskReward, 6);
  });

  it('would NOT match riskReward if measured from a lastPrice that has drifted from entry (the bug)', () => {
    const entry = 1.06;
    const lastPrice = 1.0601; // tiny drift from entry
    const stop = 1.0635;
    const target = 0.545;

    const stopMovePct = Math.abs((stop - entry) / entry);
    const targetMovePct = Math.abs((target - entry) / entry);
    const riskReward = targetMovePct / stopMovePct;

    const pctStopFromLastPrice = pctToLevel(lastPrice, stop, entry);
    const pctTargetFromLastPrice = pctToLevel(lastPrice, target, entry);
    const ratioFromLastPrice = Math.abs(pctTargetFromLastPrice) / Math.abs(pctStopFromLastPrice);

    expect(ratioFromLastPrice).not.toBeCloseTo(riskReward, 1);
  });
});
