import { describe, expect, it } from 'vitest';
import { entryNotionalUsd, marginBaseForRoe } from '@/lib/positionRoe';

describe('positionRoe helpers', () => {
  it('uses entry price for notional when entry is available', () => {
    expect(entryNotionalUsd({ size: 10, entryPrice: 100, markPrice: 120 })).toBe(1000);
  });

  it('falls back to mark price when entry is missing', () => {
    expect(entryNotionalUsd({ size: 2, entryPrice: 0, markPrice: 250 })).toBe(500);
  });

  it('keeps positionIM when it is plausible', () => {
    const margin = marginBaseForRoe({
      size: 1,
      entryPrice: 10_000,
      markPrice: 10_050,
      leverage: 20,
      positionIM: 520,
    });
    expect(margin).toBe(520);
  });

  it('rejects implausibly tiny positionIM and falls back to leverage margin', () => {
    const margin = marginBaseForRoe({
      size: 1000,
      entryPrice: 319.621,
      markPrice: 319.7,
      leverage: 100,
      positionIM: 16,
    });
    expect(margin).toBeCloseTo(3196.21, 2);
  });
});
