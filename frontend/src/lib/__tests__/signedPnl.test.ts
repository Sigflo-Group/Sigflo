import { describe, expect, it } from 'vitest';
import { formatSignedPercent, formatSignedUsd } from '@/lib/signedPnl';

describe('signedPnl formatting', () => {
  it('clamps tiny negative usd values to +$0.00', () => {
    expect(formatSignedUsd(-0.000001)).toBe('+$0.00');
    expect(formatSignedUsd(-0.0049)).toBe('+$0.00');
  });

  it('retains negative sign once rounded value is non-zero', () => {
    expect(formatSignedUsd(-0.005)).toBe('−$0.01');
  });

  it('clamps tiny negative percent values to +0.0%', () => {
    expect(formatSignedPercent(-0.0001, 1)).toBe('+0.0%');
    expect(formatSignedPercent(-0.049, 1)).toBe('+0.0%');
  });

  it('retains negative percent once rounded value is non-zero', () => {
    expect(formatSignedPercent(-0.05, 1)).toBe('−0.1%');
  });
});
