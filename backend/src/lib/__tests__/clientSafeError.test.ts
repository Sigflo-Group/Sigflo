import { describe, expect, it } from 'vitest';
import { clientSafeExchangeError } from '../clientSafeError.js';

describe('clientSafeExchangeError', () => {
  it('redacts api key mentions', () => {
    expect(clientSafeExchangeError(new Error('Invalid api key secret'))).toMatch(/credentials were rejected/i);
  });

  it('truncates very long messages', () => {
    const long = 'x'.repeat(200);
    expect(clientSafeExchangeError(new Error(long))).toBe('Exchange request failed.');
  });

  it('rejects messages with suspicious tokens even when short', () => {
    expect(clientSafeExchangeError(new Error('retCode=10001 secret leak'))).toBe('Exchange request failed.');
  });
});
