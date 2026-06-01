import type { Response } from 'express';
import type { z } from 'zod';
import type { AuthedRequest } from '../middleware/auth.js';
import { getBrokerAccountForUser, listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import { consumeTradeIntent, createTradeIntent, resolveTradeIntentByToken } from '../services/tradeIntent.service.js';
import { computeRiskSummary, validateTradePolicy } from '../services/tradePolicy.service.js';
import { executeBrokerOrder } from '../services/brokerExecution.service.js';
import { createTradeRow, getTradeByIdForUser, listTradesForUser } from '../db/queries/trades.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import { consumeIdempotencyKey } from '../utils/idempotency.js';
import { SECURITY } from '../config/security.js';
import { tradeIntentSchema, tradeExecuteSchema } from '../schemas/trade.schema.js';

type TradeIntentBody = z.infer<typeof tradeIntentSchema>;
type TradeExecuteBody = z.infer<typeof tradeExecuteSchema>;

export async function postTradeIntent(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const body = req.body as TradeIntentBody;

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
  const body = req.body as TradeExecuteBody;
  const intent = await resolveTradeIntentByToken(req.user.userId, body.executionToken);
  if (!intent) return res.status(404).json({ error: 'Execution intent not found' });
  if (intent.usedAt) return res.status(409).json({ error: 'Execution intent already used' });
  if (Date.parse(intent.expiresAt) <= Date.now()) return res.status(410).json({ error: 'Execution intent expired' });
  const idempotent = consumeIdempotencyKey(`${req.user.userId}:${body.idempotencyKey}`, SECURITY.idempotencyTtlSec * 1000);
  if (!idempotent) return res.status(409).json({ error: 'Duplicate execution request' });
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

  // Consume the intent BEFORE calling the broker so a retry after a partial
  // failure cannot place a second order. If the broker call then fails, the
  // user must create a new intent — better than a duplicate live position.
  await consumeTradeIntent(req.user.userId, intent.id, body.idempotencyKey);

  const broker = await executeBrokerOrder({
    account,
    symbol: intent.symbol,
    direction: intent.direction,
    positionSizeUsd: Number(intent.positionSizeUsd),
    leverage: Number(intent.leverage),
    entryPrice,
  });

  // Write the local trade record. If this fails the broker order still exists —
  // record everything we know in the audit log so nothing is silently lost.
  let trade: Awaited<ReturnType<typeof createTradeRow>> | null = null;
  try {
    trade = await createTradeRow({
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
  } catch (dbErr) {
    await writeAuditLog({
      userId: req.user.userId,
      requestId: req.requestId,
      action: 'trade.execute',
      objectType: 'trade',
      outcome: 'failure',
      payload: {
        tradeIntentId: intent.id,
        brokerOrderId: broker.brokerOrderId,
        brokerResponse: broker.brokerResponse,
        dbError: dbErr instanceof Error ? dbErr.message : String(dbErr),
        note: 'Broker order placed but local trade row failed to persist.',
      },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
    });
    return res.status(500).json({ error: 'Order placed but local record failed. Contact support.' });
  }

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
