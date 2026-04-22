import { db } from '../index.js';

export type TradeRow = {
  id: string;
  userId: string;
  brokerAccountId: string;
  tradeIntentId: string | null;
  brokerOrderId: string | null;
  symbol: string;
  direction: 'long' | 'short';
  positionSizeUsd: number;
  leverage: number;
  entryPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  status: string;
  brokerResponse: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export async function createTradeRow(input: {
  userId: string;
  brokerAccountId: string;
  tradeIntentId: string | null;
  brokerOrderId: string | null;
  symbol: string;
  direction: 'long' | 'short';
  positionSizeUsd: number;
  leverage: number;
  entryPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  status: string;
  brokerResponse: Record<string, unknown>;
}): Promise<TradeRow> {
  const { rows } = await db.query<TradeRow>(
    `insert into trades
      (user_id, broker_account_id, trade_intent_id, broker_order_id, symbol, direction, position_size_usd, leverage, entry_price, stop_price, target_price, status, broker_response)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
     returning id, user_id as "userId", broker_account_id as "brokerAccountId",
       trade_intent_id as "tradeIntentId", broker_order_id as "brokerOrderId",
       symbol, direction, position_size_usd as "positionSizeUsd", leverage,
       entry_price as "entryPrice", stop_price as "stopPrice", target_price as "targetPrice",
       status, broker_response as "brokerResponse", created_at as "createdAt", updated_at as "updatedAt"`,
    [
      input.userId,
      input.brokerAccountId,
      input.tradeIntentId,
      input.brokerOrderId,
      input.symbol,
      input.direction,
      input.positionSizeUsd,
      input.leverage,
      input.entryPrice,
      input.stopPrice,
      input.targetPrice,
      input.status,
      JSON.stringify(input.brokerResponse ?? {}),
    ],
  );
  return rows[0]!;
}

export async function getTradeByIdForUser(userId: string, id: string): Promise<TradeRow | null> {
  const { rows } = await db.query<TradeRow>(
    `select id, user_id as "userId", broker_account_id as "brokerAccountId",
      trade_intent_id as "tradeIntentId", broker_order_id as "brokerOrderId",
      symbol, direction, position_size_usd as "positionSizeUsd", leverage,
      entry_price as "entryPrice", stop_price as "stopPrice", target_price as "targetPrice",
      status, broker_response as "brokerResponse", created_at as "createdAt", updated_at as "updatedAt"
     from trades where user_id = $1 and id = $2 limit 1`,
    [userId, id],
  );
  return rows[0] ?? null;
}

export async function listTradesForUser(userId: string, limit = 50, cursor?: string | null): Promise<TradeRow[]> {
  if (cursor) {
    const { rows } = await db.query<TradeRow>(
      `select id, user_id as "userId", broker_account_id as "brokerAccountId",
        trade_intent_id as "tradeIntentId", broker_order_id as "brokerOrderId",
        symbol, direction, position_size_usd as "positionSizeUsd", leverage,
        entry_price as "entryPrice", stop_price as "stopPrice", target_price as "targetPrice",
        status, broker_response as "brokerResponse", created_at as "createdAt", updated_at as "updatedAt"
       from trades where user_id = $1 and created_at < $2
       order by created_at desc limit $3`,
      [userId, cursor, limit],
    );
    return rows;
  }
  const { rows } = await db.query<TradeRow>(
    `select id, user_id as "userId", broker_account_id as "brokerAccountId",
      trade_intent_id as "tradeIntentId", broker_order_id as "brokerOrderId",
      symbol, direction, position_size_usd as "positionSizeUsd", leverage,
      entry_price as "entryPrice", stop_price as "stopPrice", target_price as "targetPrice",
      status, broker_response as "brokerResponse", created_at as "createdAt", updated_at as "updatedAt"
     from trades where user_id = $1 order by created_at desc limit $2`,
    [userId, limit],
  );
  return rows;
}
