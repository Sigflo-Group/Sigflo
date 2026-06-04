import { describe, expect, it } from 'vitest';
import { hasAal2 } from '../authAssurance.js';

describe('hasAal2', () => {
  it('returns true for aal2 claim', () => {
    expect(hasAal2({ aal: 'aal2' })).toBe(true);
  });

  it('returns true for mfa in amr', () => {
    expect(hasAal2({ amr: [{ method: 'totp' }] })).toBe(true);
  });

  it('returns false for aal1 only', () => {
    expect(hasAal2({ aal: 'aal1' })).toBe(false);
  });
});
