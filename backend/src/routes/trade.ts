import { Router } from 'express';
import { z } from 'zod';
import type { AuthedRequest } from '../middleware/auth.js';
import { BybitAdapter } from '../exchanges/bybit.js';
import { decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import { log } from '../lib/logger.js';
import { formatZodIssuesForApi } from '../lib/formatZodError.js';
import { isBybitTradingStopNoopError } from '../lib/bybitNoopErrors.js';

export const tradeRouter = Router();

const bybitTriggerBySchema = z.enum(['MarkPrice', 'LastPrice', 'IndexPrice']);

const linearOrderSchema = z.object({
  symbol: z.string().min(4).max(32),
  side: z.enum(['Buy', 'Sell']),
  orderType: z.enum(['Market', 'Limit']).default('Market'),
  qty: z.string().min(1).max(64),
  reduceOnly: z.boolean().optional(),
  price: z.string().optional(),
  positionIdx: z.number().int().min(0).max(2).optional(),
  /** Applied via `/v5/position/set-leverage` before the order (best effort). */
  leverage: z.number().min(1).max(125).optional(),
  /** Bybit linear TP/SL on open (market exit when hit). Requires valid side vs entry on exchange. */
  takeProfit: z.string().min(1).max(48).optional(),
  stopLoss: z.string().min(1).max(48).optional(),
  tpTriggerBy: bybitTriggerBySchema.optional(),
  slTriggerBy: bybitTriggerBySchema.optional(),
});

const spotOrderSchema = z.object({
  symbol: z.string().min(4).max(32),
  side: z.enum(['Buy', 'Sell']),
  orderType: z.enum(['Market', 'Limit']).default('Market'),
  qty: z.string().min(1).max(64),
  marketUnit: z.enum(['baseCoin', 'quoteCoin']),
  price: z.string().optional(),
});

const bybitAdapter = new BybitAdapter();

tradeRouter.post('/bybit/linear-order', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = linearOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const row = accounts.find((a) => a.broker === 'bybit');
  if (!row) {
    res.status(400).json({ error: 'Connect Bybit in Account first.' });
    return;
  }

  const creds = {
    apiKey: decryptBrokerCredential(row.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(row.apiSecretEncrypted),
  };

  try {
    await bybitAdapter.ensureTradeEnabled(creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Trade not allowed for this key.';
    log('warn', 'Bybit trade permission check failed.', { error: msg });
    res.status(403).json({ error: 'API key does not have trading permission' });
    return;
  }

  const p = parsed.data;
  try {
    if (p.leverage != null && Number.isFinite(p.leverage)) {
      try {
        await bybitAdapter.setLinearLeverage(creds, p.symbol, p.leverage);
      } catch (levErr) {
        log('warn', 'Bybit set-leverage skipped or failed.', {
          symbol: p.symbol,
          error: String(levErr),
        });
      }
    }

    const result = await bybitAdapter.placeLinearOrder(creds, {
      symbol: p.symbol,
      side: p.side,
      orderType: p.orderType,
      qty: p.qty.trim(),
      reduceOnly: p.reduceOnly,
      price: p.price?.trim(),
      positionIdx: p.positionIdx,
      takeProfit: p.takeProfit?.trim(),
      stopLoss: p.stopLoss?.trim(),
      tpTriggerBy: p.tpTriggerBy,
      slTriggerBy: p.slTriggerBy,
    });

    const tpSlNote =
      p.takeProfit || p.stopLoss
        ? ' TP/SL sent with the order (Full, market trigger) — confirm on Bybit.'
        : '';
    res.json({
      ok: true,
      exchange: 'bybit',
      orderId: result.orderId,
      orderLinkId: result.orderLinkId ?? null,
      note: `Order accepted by Bybit — confirm fill and position via portfolio sync.${tpSlNote}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Order failed';
    log('warn', 'Bybit order failed.', { error: msg });
    res.status(400).json({ error: 'Order failed' });
  }
});

const linearTradingStopSchema = z.object({
  symbol: z.string().min(4).max(32),
  positionIdx: z.number().int().min(0).max(2).default(0),
  /** Use `"0"` to clear TP on the position (Bybit convention). */
  takeProfit: z.string().min(1).max(48),
  /** Use `"0"` to clear SL on the position (Bybit convention). */
  stopLoss: z.string().min(1).max(48),
  tpTriggerBy: bybitTriggerBySchema.optional(),
  slTriggerBy: bybitTriggerBySchema.optional(),
});

tradeRouter.post('/bybit/linear-trading-stop', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = linearTradingStopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const row = accounts.find((a) => a.broker === 'bybit');
  if (!row) {
    res.status(400).json({ error: 'Connect Bybit in Account first.' });
    return;
  }

  const creds = {
    apiKey: decryptBrokerCredential(row.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(row.apiSecretEncrypted),
  };

  try {
    await bybitAdapter.ensureTradeEnabled(creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Trade not allowed for this key.';
    log('warn', 'Bybit trade permission check failed.', { error: msg });
    res.status(403).json({ error: 'API key does not have trading permission' });
    return;
  }

  const p = parsed.data;
  try {
    await bybitAdapter.setLinearTradingStop(creds, {
      symbol: p.symbol,
      positionIdx: p.positionIdx,
      takeProfit: p.takeProfit.trim(),
      stopLoss: p.stopLoss.trim(),
      tpTriggerBy: p.tpTriggerBy,
      slTriggerBy: p.slTriggerBy,
    });
    res.json({
      ok: true,
      exchange: 'bybit',
      note: 'TP/SL updated on Bybit (full position, market trigger) — confirm on the exchange.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Trading stop failed';
    if (isBybitTradingStopNoopError(msg)) {
      res.json({
        ok: true,
        exchange: 'bybit',
        note: 'TP/SL already matched on Bybit — no update needed.',
      });
      return;
    }
    log('warn', 'Bybit trading-stop failed.', { error: msg });
    res.status(400).json({ error: 'Trading stop failed' });
  }
});

const setLinearLeverageSchema = z.object({
  symbol: z.string().min(4).max(32),
  leverage: z.number().min(1).max(200),
});

/** Update isolated margin leverage for a linear symbol (applies to an open position on Bybit). */
tradeRouter.post('/bybit/set-leverage', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = setLinearLeverageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const row = accounts.find((i) => i.broker === 'bybit');
  if (!row) {
    res.status(400).json({ error: 'Connect Bybit in Account first.' });
    return;
  }

  const creds = {
    apiKey: decryptBrokerCredential(row.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(row.apiSecretEncrypted),
  };

  try {
    await bybitAdapter.ensureTradeEnabled(creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Trade not allowed for this key.';
    log('warn', 'Bybit trade permission check failed.', { error: msg });
    res.status(403).json({ error: 'API key does not have trading permission' });
    return;
  }

  const p = parsed.data;
  try {
    await bybitAdapter.setLinearLeverage(creds, p.symbol, p.leverage);
    res.json({
      ok: true,
      exchange: 'bybit',
      note: 'Leverage updated on Bybit for this symbol.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Set leverage failed';
    log('warn', 'Bybit set-leverage failed.', { symbol: p.symbol, error: msg });
    res.status(400).json({ error: 'Set leverage failed' });
  }
});

tradeRouter.post('/bybit/spot-order', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = spotOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const row = accounts.find((i) => i.broker === 'bybit');
  if (!row) {
    res.status(400).json({ error: 'Connect Bybit in Account first.' });
    return;
  }

  const creds = {
    apiKey: decryptBrokerCredential(row.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(row.apiSecretEncrypted),
  };

  try {
    await bybitAdapter.ensureTradeEnabled(creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Trade not allowed for this key.';
    log('warn', 'Bybit trade permission check failed.', { error: msg });
    res.status(403).json({ error: 'API key does not have trading permission' });
    return;
  }

  const p = parsed.data;
  try {
    const result = await bybitAdapter.placeSpotOrder(creds, {
      symbol: p.symbol,
      side: p.side,
      orderType: p.orderType,
      qty: p.qty.trim(),
      marketUnit: p.marketUnit,
      price: p.price?.trim(),
    });

    res.json({
      ok: true,
      exchange: 'bybit',
      orderId: result.orderId,
      orderLinkId: result.orderLinkId ?? null,
      note: 'Spot order accepted by Bybit — confirm fill via portfolio sync.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Order failed';
    log('warn', 'Bybit spot order failed.', { error: msg });
    res.status(400).json({ error: 'Order failed' });
  }
});
