import { describe, expect, it } from 'vitest';
import { hasAal2, isMfaFresh } from '../authAssurance.js';

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

  it('does not match substring mfa in unrelated amr strings', () => {
    expect(hasAal2({ amr: ['password_mfa_enrolled'] })).toBe(false);
  });
});

describe('isMfaFresh', () => {
  it('returns true when totp timestamp is recent', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    expect(
      isMfaFresh({ amr: [{ method: 'totp', timestamp: nowSec }] }, 900),
    ).toBe(true);
  });

  it('returns false when totp timestamp is stale', () => {
    const stale = Math.floor(Date.now() / 1000) - 3600;
    expect(isMfaFresh({ amr: [{ method: 'totp', timestamp: stale }] }, 900)).toBe(false);
  });
});
