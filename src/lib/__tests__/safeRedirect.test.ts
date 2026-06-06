import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '../safeRedirect';

describe('safeRedirectPath', () => {
  it('allows relative in-app paths', () => {
    expect(safeRedirectPath('/trade/BTCUSDT', '/fallback')).toBe('/trade/BTCUSDT');
  });

  it('rejects external and protocol-relative URLs', () => {
    expect(safeRedirectPath('https://evil.com', '/fallback')).toBe('/fallback');
    expect(safeRedirectPath('//evil.com', '/fallback')).toBe('/fallback');
  });

  it('falls back when empty', () => {
    expect(safeRedirectPath(null, '/settings/security')).toBe('/settings/security');
  });
});
