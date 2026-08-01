/**
 * Regression test for the public MEXC market-data routes' symbol double-conversion
 * bug: the frontend client (src/services/mexc/publicClient.ts) already converts a
 * symbol to MEXC's underscored contract format ("XRPUSDT" -> "XRP_USDT") before
 * building the request URL, so this route always receives an already-converted
 * symbol. Re-converting it again produced "XRP__USDT" (double underscore), which
 * matches no real MEXC contract — silently breaking every public kline/ticker
 * fetch for a managed position's chart and causing it to fall back to synthetic
 * placeholder candle/volume/H-L data instead of real market data.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { toMexcSymbol } from './mexcPublic.js';

test('toMexcSymbol — converts a plain symbol once', () => {
  assert.equal(toMexcSymbol('XRPUSDT'), 'XRP_USDT');
});

test('toMexcSymbol — is idempotent on an already-underscored symbol', () => {
  assert.equal(toMexcSymbol('XRP_USDT'), 'XRP_USDT');
});

test('toMexcSymbol — calling it twice never double-inserts an underscore', () => {
  const once = toMexcSymbol('BTCUSDT');
  const twice = toMexcSymbol(once);
  assert.equal(once, 'BTC_USDT');
  assert.equal(twice, 'BTC_USDT');
});
