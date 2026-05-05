import { db } from '../index.js';

export type TradeIntentRow = {
  id: string;
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
  executionTokenHash: string;
  idempotencyKey: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

export async function createTradeIntentRow(input: {
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
  executionTokenHash: string;
  expiresAt: string;
}): Promise<TradeIntentRow> {
  const { rows } = await db.query<TradeIntentRow>(
    `insert into trade_intents
    (user_id, broker_account_id, symbol, direction, entry_price, stop_price, target_price, position_size_usd, leverage, risk_summary, execution_token_hash, expires_at)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)
    returning id, user_id as "userId", broker_account_id as "brokerAccountId", symbol, direction,
      entry_price as "entryPrice", stop_price as "stopPrice", target_price as "targetPrice",
      position_size_usd as "positionSizeUsd", leverage, risk_summary as "riskSummary",
      execution_token_hash as "executionTokenHash", idempotency_key as "idempotencyKey",
      expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"`,
    [
      input.userId,
      input.brokerAccountId,
      input.symbol,
      input.direction,
      input.entryPrice,
      input.stopPrice,
      input.targetPrice,
      input.positionSizeUsd,
      input.leverage,
      JSON.stringify(input.riskSummary ?? {}),
      input.executionTokenHash,
      input.expiresAt,
    ],
  );
  return rows[0]!;
}

export async function getTradeIntentByTokenHash(userId: string, tokenHash: string): Promise<TradeIntentRow | null> {
  const { rows } = await db.query<TradeIntentRow>(
    `select id, user_id as "userId", broker_account_id as "brokerAccountId", symbol, direction,
      entry_price as "entryPrice", stop_price as "stopPrice", target_price as "targetPrice",
      position_size_usd as "positionSizeUsd", leverage, risk_summary as "riskSummary",
      execution_token_hash as "executionTokenHash", idempotency_key as "idempotencyKey",
      expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
     from trade_intents where user_id = $1 and execution_token_hash = $2 limit 1`,
    [userId, tokenHash],
  );
  return rows[0] ?? null;
}

export async function markTradeIntentUsed(userId: string, intentId: string, idempotencyKey: string): Promise<void> {
  await db.query(`update trade_intents set used_at = now(), idempotency_key = $3 where id = $1 and user_id = $2`, [intentId, userId, idempotencyKey]);
}
