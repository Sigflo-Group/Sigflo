import assert from 'node:assert/strict';
import test from 'node:test';
import { computeRiskSummary, validateTradePolicy } from './tradePolicy.service.js';

const base = {
  symbol: 'BTCUSDT',
  direction: 'long' as const,
  positionSizeUsd: 1_000,
  leverage: 5,
  entryPrice: 100,
  stopPrice: 95,
  targetPrice: 110,
};

test('accepts a coherent long trade and computes useful risk metrics', () => {
  assert.deepEqual(validateTradePolicy(base), { ok: true });
  const summary = computeRiskSummary(base);
  assert.equal(summary.estimatedMarginUsd, 200);
  assert.equal(summary.stopDistancePct, 5);
  assert.equal(summary.targetDistancePct, 10);
  assert.equal(summary.riskRewardRatio, 2);
  assert.equal(summary.liquidationBufferPct, null);
});

test('rejects long stop above entry', () => {
  assert.deepEqual(validateTradePolicy({ ...base, stopPrice: 101 }), {
    ok: false,
    reason: 'Long stop must be below entry',
  });
});

test('rejects long target below entry', () => {
  assert.deepEqual(validateTradePolicy({ ...base, targetPrice: 99 }), {
    ok: false,
    reason: 'Long target must be above entry',
  });
});

test('rejects short stop below entry and target above entry', () => {
  assert.deepEqual(
    validateTradePolicy({ ...base, direction: 'short', stopPrice: 99, targetPrice: 90 }),
    { ok: false, reason: 'Short stop must be above entry' },
  );
  assert.deepEqual(
    validateTradePolicy({ ...base, direction: 'short', stopPrice: 105, targetPrice: 101 }),
    { ok: false, reason: 'Short target must be below entry' },
  );
});

test('does not fabricate price-derived metrics without an entry price', () => {
  const summary = computeRiskSummary({
    symbol: 'ETHUSDT',
    direction: 'long',
    positionSizeUsd: 2_000,
    leverage: 10,
  });
  assert.equal(summary.estimatedMarginUsd, 200);
  assert.equal(summary.stopDistancePct, null);
  assert.equal(summary.targetDistancePct, null);
  assert.equal(summary.riskRewardRatio, null);
  assert.equal(summary.liquidationBufferPct, null);
});
