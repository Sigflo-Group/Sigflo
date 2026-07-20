import type { Response } from 'express';
import type { z } from 'zod';
import type { AuthedRequest } from '../middleware/auth.js';
import { getBrokerAccountForUser, listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import { consumeTradeIntent, createTradeIntent, resolveTradeIntentByToken } from '../services/tradeIntent.service.js';
import { computeRiskSummary, validateTradePolicy } from '../services/tradePolicy.service.js';
import { executeBrokerOrder } from '../services/brokerExecution.service.js';
import { createTradeRow, getTradeByIdForUser, listTradesForUser } from '../db/queries/trades.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  failIdempotentRequest,
  hashIdempotencyRequest,
  inspectIdempotentRequest,
  type IdempotencyState,
} from '../utils/idempotency.js';
import { SECURITY } from '../config/security.js';
import { tradeIntentSchema, tradeExecuteSchema } from '../schemas/trade.schema.js';
import { enforceReliableLiveRiskLimits } from '../services/riskEnforcement.service.js';

type TradeIntentBody = z.infer<typeof tradeIntentSchema>;
type TradeExecuteBody = z.infer<typeof tradeExecuteSchema>;

function respondFromIdempotencyState(res: Response, state: IdempotencyState): Response | null {
  if (state.kind === 'missing') return null;
  if (state.kind === 'unavailable') {
    return res.status(503).json({ error: 'Idempotency store unavailable. Try again shortly.' });
  }
  if (state.kind === 'conflict') {
    return res.status(409).json({ error: 'Idempotency key was already used for a different execution request.' });
  }
  if (state.kind === 'processing') {
    res.setHeader('Retry-After', '2');
    return res.status(409).json({ error: 'Execution with this idempotency key is still processing.' });
  }
  if (state.kind === 'failed') {
    return res.status(409).json({
      error: 'The previous execution with this idempotency key failed. Create a new intent before retrying.',
    });
  }
  return res.json(state.response);
}

export async function postTradeIntent(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const body = req.body as TradeIntentBody;

  const policy = validateTradePolicy(body);
  if (!policy.ok) return res.status(400).json({ error: policy.reason });

  let account;
  if (body.brokerAccountId) {
    account = await getBrokerAccountForUser(req.user.userId, body.brokerAccountId);
    if (!account) {
      return res.status(404).json({ error: 'Broker account not found' });
    }
  } else {
    const accounts = await listBrokerAccountsForUser(req.user.userId);
    account = accounts.find((a) => a.status === 'connected') ?? null;
    if (!account) return res.status(400).json({ error: 'No linked broker account.' });
  }

  const riskGate = await enforceReliableLiveRiskLimits({
    userId: req.user.userId,
    account,
    symbol: body.symbol,
  });
  if (!riskGate.ok) return res.status(riskGate.status).json({ error: riskGate.reason });

  const riskSummary = computeRiskSummary(body);
  const intent = await createTradeIntent({
    userId: req.user.userId,
    brokerAccountId: account.id,
    symbol: body.symbol,
    direction: body.direction,
    entryPrice: body.entryPrice ?? null,
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

  const entryPrice = Number(body.entryPrice ?? intent.entryPrice);
  const idempotencyKey = `${req.user.userId}:trade.execute:${body.idempotencyKey}`;
  const requestHash = hashIdempotencyRequest({
    endpoint: 'trade.execute',
    userId: req.user.userId,
    intentId: intent.id,
    brokerAccountId: intent.brokerAccountId,
    symbol: intent.symbol,
    direction: intent.direction,
    positionSizeUsd: Number(intent.positionSizeUsd),
    leverage: Number(intent.leverage),
    entryPrice,
  });

  // Inspect before checking usedAt so a successful retry can replay the stored
  // response even though the execution intent was consumed by the first call.
  const existing = await inspectIdempotentRequest(idempotencyKey, requestHash);
  const existingResponse = respondFromIdempotencyState(res, existing);
  if (existingResponse) return existingResponse;

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

  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return res.status(422).json({ error: 'Execution intent is missing a valid entry price' });
  }

  const riskGate = await enforceReliableLiveRiskLimits({
    userId: req.user.userId,
    account,
    symbol: intent.symbol,
  });
  if (!riskGate.ok) return res.status(riskGate.status).json({ error: riskGate.reason });

  // Create the processing record only after all local/pre-execution validation
  // succeeds. A 4xx rejection above therefore does not burn the caller's key.
  // beginIdempotentRequest is atomic, so concurrent requests still collapse to
  // one accepted execution even if both observed "missing" during inspection.
  const begun = await beginIdempotentRequest({
    key: idempotencyKey,
    requestHash,
    ttlMs: SECURITY.idempotencyTtlSec * 1000,
  });
  if (begun.kind !== 'accepted') {
    const begunResponse = respondFromIdempotencyState(res, begun);
    if (begunResponse) return begunResponse;
    return res.status(409).json({ error: 'Duplicate execution request' });
  }

  try {
    // Consume the intent BEFORE calling the broker so a retry after a partial
    // failure cannot place a second order with a different request path.
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
        entryPrice,
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
      throw dbErr;
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

    const responsePayload = { ok: true, trade };
    await completeIdempotentRequest(idempotencyKey, requestHash, responsePayload);
    return res.json(responsePayload);
  } catch (error) {
    await failIdempotentRequest(
      idempotencyKey,
      requestHash,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
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
