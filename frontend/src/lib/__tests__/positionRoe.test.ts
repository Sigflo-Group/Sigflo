import { describe, expect, it } from 'vitest';
import { entryNotionalUsd, livePnlPercent, marginBaseForRoe } from '@/lib/positionRoe';

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

  it('accepts numeric strings so leverage fallback still works', () => {
    const margin = marginBaseForRoe({
      size: 1000,
      entryPrice: 319.621,
      markPrice: 319.7,
      leverage: '100',
      positionIM: '16',
    });
    expect(margin).toBeCloseTo(3196.21, 2);
  });

  it('parses leverage strings with suffixes used by some exchanges', () => {
    const margin = marginBaseForRoe({
      size: 1000,
      entryPrice: 319.621,
      markPrice: 319.7,
      leverage: '100x',
      positionIM: '16 USDT',
    });
    expect(margin).toBeCloseTo(3196.21, 2);
  });

  it('does not use tiny IM when leverage is unavailable', () => {
    const margin = marginBaseForRoe({
      size: 1000,
      entryPrice: 319.621,
      markPrice: 319.7,
      positionIM: 16,
    });
    expect(margin).toBeCloseTo(319621, 0);
  });

  it('falls back to leverage-adjusted move when margin path diverges too far', () => {
    const pct = livePnlPercent({
      side: 'long',
      unrealizedPnl: -0.02,
      size: 230,
      entryPrice: 0.003944,
      markPrice: 0.003857,
      leverage: 100,
      positionIM: 5,
    });
    // mark/entry move is ~ -2.205%; at 100x this should be about -220.5%,
    // not the tiny ~-0.4% from an over-large IM base.
    expect(pct).toBeCloseTo(-220.59, 2);
  });

  it('keeps margin-based pct when it remains directionally aligned', () => {
    const pct = livePnlPercent({
      side: 'long',
      unrealizedPnl: 124.56,
      size: 1000,
      entryPrice: 319.621,
      markPrice: 319.7,
      leverage: 100,
      positionIM: 3200,
    });
    expect(pct).toBeCloseTo(3.89, 1);
  });

  it('avoids blown-up pct when IM is tiny and leverage is missing', () => {
    const pct = livePnlPercent({
      side: 'long',
      unrealizedPnl: 124.56,
      size: 1000,
      entryPrice: 319.621,
      markPrice: 319.7,
      positionIM: 16,
    });
    expect(pct).toBeCloseTo(0.039, 2);
  });
});
