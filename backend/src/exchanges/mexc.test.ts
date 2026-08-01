/**
 * Regression test for the MEXC symbol double-conversion bug: the frontend
 * trade client normalizes a symbol to MEXC's underscored format before
 * posting to /trade/mexc/linear-order and /trade/mexc/linear-trading-stop,
 * and the backend then normalized it *again* inside placeLinearOrder /
 * setPositionTpSl / fetchMexcOpenPositionLeg — turning "BTCUSDT" into
 * "BTC__USDT" (double underscore), which matches no real MEXC contract or
 * open position. This broke every close/TP-SL/order call through those
 * routes, surfacing to users as "no open position" / contract-not-found
 * errors.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { standardSymbolToMexc } from './mexc.js';

test('standardSymbolToMexc — converts a plain standard symbol once', () => {
  assert.equal(standardSymbolToMexc('BTCUSDT'), 'BTC_USDT');
});

test('standardSymbolToMexc — is idempotent on an already-underscored symbol', () => {
  assert.equal(standardSymbolToMexc('BTC_USDT'), 'BTC_USDT');
});

test('standardSymbolToMexc — calling it twice never double-inserts an underscore', () => {
  const once = standardSymbolToMexc('ETHUSDT');
  const twice = standardSymbolToMexc(once);
  assert.equal(once, 'ETH_USDT');
  assert.equal(twice, 'ETH_USDT');
});
