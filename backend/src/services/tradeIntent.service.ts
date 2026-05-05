import crypto from 'node:crypto';
import { SECURITY } from '../config/security.js';
import { createTradeIntentRow, getTradeIntentByTokenHash, markTradeIntentUsed } from '../db/queries/tradeIntents.js';

export async function createTradeIntent(input: {
  userId: string;
  brokerAccountId: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  positionSizeUsd: number;
  leverage: number;
  riskSummary: Record<string, unknown>;
}) {
  const executionToken = crypto.randomBytes(24).toString('base64url');
  const executionTokenHash = crypto.createHash('sha256').update(executionToken).digest('hex');
  const expiresAt = new Date(Date.now() + SECURITY.executionIntentTtlSec * 1000).toISOString();
  const row = await createTradeIntentRow({
    ...input,
    executionTokenHash,
    expiresAt,
  });
  return { row, executionToken, expiresAt };
}

export async function resolveTradeIntentByToken(userId: string, executionToken: string) {
  const hash = crypto.createHash('sha256').update(executionToken).digest('hex');
  return getTradeIntentByTokenHash(userId, hash);
}

export async function consumeTradeIntent(userId: string, intentId: string, idempotencyKey: string) {
  await markTradeIntentUsed(userId, intentId, idempotencyKey);
}
