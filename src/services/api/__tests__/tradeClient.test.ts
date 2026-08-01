/**
 * Regression test for the MEXC symbol double-conversion bug: toMexcSymbol
 * normalizes a plain symbol ("BTCUSDT") to MEXC's underscored format
 * ("BTC_USDT") before posting to the backend, which then normalizes it
 * again internally. If toMexcSymbol re-inserts an underscore into an
 * already-underscored symbol, the result ("BTC__USDT") matches no real
 * MEXC contract or open position — breaking close/TP-SL/order calls.
 */

import { describe, it, expect } from 'vitest';
import { toMexcSymbol } from '@/services/api/tradeClient';

describe('toMexcSymbol', () => {
  it('converts a plain standard symbol once', () => {
    expect(toMexcSymbol('BTCUSDT')).toBe('BTC_USDT');
  });

  it('is idempotent on an already-underscored symbol', () => {
    expect(toMexcSymbol('BTC_USDT')).toBe('BTC_USDT');
  });

  it('calling it twice never double-inserts an underscore', () => {
    const once = toMexcSymbol('ETHUSDT');
    const twice = toMexcSymbol(once);
    expect(once).toBe('ETH_USDT');
    expect(twice).toBe('ETH_USDT');
  });
});
