/**
 * Regression test for the public MEXC market-data client's symbol double-conversion
 * bug: this client converts a plain symbol to MEXC's underscored contract format
 * before building the request URL. The backend route then re-converts it — if this
 * client's conversion isn't idempotent, and any caller ever passes an
 * already-underscored symbol, the pair would double-convert into a garbled symbol
 * that matches no real MEXC contract, breaking the kline/ticker fetch.
 */

import { describe, it, expect } from 'vitest';
import { toMexcSymbol } from '@/services/mexc/publicClient';

describe('toMexcSymbol (mexc public client)', () => {
  it('converts a plain standard symbol once', () => {
    expect(toMexcSymbol('XRPUSDT')).toBe('XRP_USDT');
  });

  it('is idempotent on an already-underscored symbol', () => {
    expect(toMexcSymbol('XRP_USDT')).toBe('XRP_USDT');
  });

  it('calling it twice never double-inserts an underscore', () => {
    const once = toMexcSymbol('BTCUSDT');
    const twice = toMexcSymbol(once);
    expect(once).toBe('BTC_USDT');
    expect(twice).toBe('BTC_USDT');
  });
});
