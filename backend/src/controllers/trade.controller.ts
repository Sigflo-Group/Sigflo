import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { getBrokerAccountForUser, listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import { consumeTradeIntent, createTradeIntent, resolveTradeIntentByToken } from '../services/tradeIntent.service.js';
import { computeRiskSummary, validateTradePolicy } from '../services/tradePolicy.service.js';
import { executeBrokerOrder } from '../services/brokerExecution.service.js';
import { createTradeRow, getTradeByIdForUser, listTradesForUser } from '../db/queries/trades.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import { consumeIdempotencyKey } from '../utils/idempotency.js';
import { SECURITY } from '../config/security.js';

export async function postTradeIntent(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const body = req.body as {
    symbol: string;
    direction: 'long' | 'short';
    positionSizeUsd: number;
    leverage: number;
    stopPrice?: number;
    targetPrice?: number;
    brokerAccountId?: string;
  };

  const policy = validateTradePolicy(body);
  if (!policy.ok) return res.status(400).json({ error: policy.reason });

  let account = body.brokerAccountId
    ? await getBrokerAccountForUser(req.user.userId, body.brokerAccountId)
    : null;
  if (!account) {
    const accounts = await listBrokerAccountsForUser(req.user.userId);
    account = accounts.find((a) => a.status === 'connected') ?? null;
  }
  if (!account) return res.status(400).json({ error: 'No linked broker account.' });

  const riskSummary = computeRiskSummary(body);
  const intent = await createTradeIntent({
    userId: req.user.userId,
    brokerAccountId: account.id,
    symbol: body.symbol,
    direction: body.direction,
    entryPrice: null,
    stopPrice: body.stopPrice ?? null,
    targetPrice: body.targetPrice ?? null,
    positionSizeUsd: body.positionSizeUsd,
    leverage: body.leverage,
    riskSummary,
  });

  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'trade.intent.create',
    objectType: 'trade_intent',
    objectId: intent.row.id,
    outcome: 'success',
    payload: body,
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json({
    intentId: intent.row.id,
    executionToken: intent.executionToken,
    expiresAt: intent.expiresAt,
    preview: {
      symbol: body.symbol,
      direction: body.direction,
      positionSizeUsd: body.positionSizeUsd,
      leverage: body.leverage,
      stopPrice: body.stopPrice,
      targetPrice: body.targetPrice,
      riskSummary,
    },
  });
}

export async function postTradeExecute(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const body = req.body as { executionToken: string; idempotencyKey: string };
  const idempotent = consumeIdempotencyKey(`${req.user.userId}:${body.idempotencyKey}`, SECURITY.idempotencyTtlSec * 1000);
  if (!idempotent) return res.status(409).json({ error: 'Duplicate execution request' });
  const intent = await resolveTradeIntentByToken(req.user.userId, body.executionToken);
  if (!intent) return res.status(404).json({ error: 'Execution intent not found' });
  if (intent.usedAt) return res.status(409).json({ error: 'Execution intent already used' });
  if (Date.parse(intent.expiresAt) <= Date.now()) return res.status(410).json({ error: 'Execution intent expired' });
  const policy = validateTradePolicy({
    symbol: intent.symbol,
    direction: intent.direction,
    positionSizeUsd: Number(intent.positionSizeUsd),
    leverage: Number(intent.leverage),
    stopPrice: intent.stopPrice ?? undefined,
    targetPrice: intent.targetPrice ?? undefined,
  });
  if (!policy.ok) return res.status(400).json({ error: policy.reason });

  const account = await getBrokerAccountForUser(req.user.userId, intent.brokerAccountId);
  if (!account) return res.status(404).json({ error: 'Broker account not found' });

  const entryPrice = Number(intent.entryPrice);
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return res.status(422).json({ error: 'Execution intent is missing a valid entry price' });
  }

  const broker = await executeBrokerOrder({
    account,
    symbol: intent.symbol,
    direction: intent.direction,
    positionSizeUsd: Number(intent.positionSizeUsd),
    leverage: Number(intent.leverage),
    entryPrice,
  });

  const trade = await createTradeRow({
    userId: req.user.userId,
    brokerAccountId: intent.brokerAccountId,
    tradeIntentId: intent.id,
    brokerOrderId: broker.brokerOrderId,
    symbol: intent.symbol,
    direction: intent.direction,
    positionSizeUsd: Number(intent.positionSizeUsd),
    leverage: Number(intent.leverage),
    entryPrice: intent.entryPrice,
    stopPrice: intent.stopPrice,
    targetPrice: intent.targetPrice,
    status: 'submitted',
    brokerResponse: broker.brokerResponse,
  });

  await consumeTradeIntent(req.user.userId, intent.id, body.idempotencyKey);
  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'trade.execute',
    objectType: 'trade',
    objectId: trade.id,
    outcome: 'success',
    payload: { tradeIntentId: intent.id, idempotencyKey: body.idempotencyKey },
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json({ ok: true, trade });
}

export async function getTradeById(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: 'Invalid trade id' });
  const trade = await getTradeByIdForUser(req.user.userId, id);
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  return res.json({ trade });
}

export async function listTrades(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const trades = await listTradesForUser(req.user.userId, 50, cursor);
  const nextCursor = trades.length > 0 ? trades[trades.length - 1]?.createdAt ?? null : null;
  return res.json({ trades, nextCursor });
}
