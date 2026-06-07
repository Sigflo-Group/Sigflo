import { Router } from 'express';
import { z } from 'zod';
import type { AuthedRequest } from '../middleware/auth.js';
import { MexcAdapter } from '../exchanges/mexc.js';
import { resolveBrokerCredentials } from '../services/brokerCredentials.js';
import { clientSafeExchangeError } from '../lib/clientSafeError.js';
import { listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import { log } from '../lib/logger.js';
import { formatZodIssuesForApi } from '../lib/formatZodError.js';
import { requireIdempotency } from '../middleware/requireIdempotency.js';

/**
 * MEXC futures order routes.
 *
 * NOTE: mounted without `requireStepUp` in `app.ts` — MEXC trading does not
 * require fresh 2FA step-up (only auth + idempotency). Aligns with the MEXC
 * trading UX choice documented in the MEXC trade flow.
 */
export const mexcTradeRouter = Router();
mexcTradeRouter.use(requireIdempotency);

const mexcAdapter = new MexcAdapter();

const mexcSetLeverageSchema = z.object({
  symbol: z.string().min(4).max(32),
  leverage: z.number().min(1).max(200),
  positionSide: z.enum(['long', 'short']),
});

/** Update leverage for an open MEXC futures leg. */
mexcTradeRouter.post('/set-leverage', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = mexcSetLeverageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const row = accounts.find((a) => a.broker === 'mexc' && a.status === 'connected');
  if (!row) {
    res.status(400).json({ error: 'Connect MEXC in Account first.' });
    return;
  }

  let creds: { apiKey: string; apiSecret: string };
  try {
    creds = await resolveBrokerCredentials(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve exchange credentials.' });
    return;
  }

  const p = parsed.data;
  try {
    await mexcAdapter.ensureTradeEnabled(creds);
    await mexcAdapter.setLinearLeverage(creds, p.symbol, p.leverage, p.positionSide);
    res.json({
      ok: true,
      exchange: 'mexc',
      note: 'Leverage updated on MEXC for this position.',
    });
  } catch (e) {
    const msg = clientSafeExchangeError(e, 'Set leverage failed');
    log('warn', 'MEXC set-leverage failed.', { symbol: p.symbol, error: msg });
    res.status(400).json({ error: msg });
  }
});

const mexcLinearOrderSchema = z.object({
  symbol: z.string().min(4).max(32),
  side: z.enum(['Buy', 'Sell']),
  orderType: z.enum(['Market', 'Limit']).default('Market'),
  qty: z.string().min(1).max(64),
  reduceOnly: z.boolean().optional(),
  price: z.string().optional(),
  leverage: z.number().min(1).max(200).optional(),
  takeProfit: z.string().min(1).max(48).optional(),
  stopLoss: z.string().min(1).max(48).optional(),
});

mexcTradeRouter.post('/linear-order', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = mexcLinearOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const row = accounts.find((a) => a.broker === 'mexc' && a.status === 'connected');
  if (!row) {
    res.status(400).json({ error: 'Connect MEXC in Account first.' });
    return;
  }

  let creds: { apiKey: string; apiSecret: string };
  try {
    creds = await resolveBrokerCredentials(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve exchange credentials.' });
    return;
  }

  const p = parsed.data;
  try {
    await mexcAdapter.ensureTradeEnabled(creds);
    const result = await mexcAdapter.placeLinearOrder(creds, {
      symbol: p.symbol,
      side: p.side,
      orderType: p.orderType,
      qty: p.qty.trim(),
      reduceOnly: p.reduceOnly,
      price: p.price?.trim(),
      leverage: p.leverage,
      takeProfit: p.takeProfit?.trim(),
      stopLoss: p.stopLoss?.trim(),
    });

    res.json({
      ok: true,
      exchange: 'mexc',
      orderId: result.orderId,
      orderLinkId: null,
      note: 'Order accepted by MEXC — confirm fill and position via portfolio sync.',
    });
  } catch (e) {
    const msg = clientSafeExchangeError(e, 'Order failed');
    log('warn', 'MEXC order failed.', { error: msg });
    res.status(400).json({ error: msg });
  }
});

const mexcLinearTradingStopSchema = z.object({
  symbol: z.string().min(4).max(32),
  positionSide: z.enum(['long', 'short']),
  qty: z.string().min(1).max(48),
  /** Price string. Omit or "0" to skip TP. */
  takeProfit: z.string().min(1).max(48).optional(),
  /** Price string. Omit or "0" to skip SL. */
  stopLoss: z.string().min(1).max(48).optional(),
});

/**
 * Apply full-position TP/SL to an open MEXC futures position via position-level
 * stoporder/place. Pass "0" (or omit) to skip a side.
 */
mexcTradeRouter.post('/linear-trading-stop', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = mexcLinearTradingStopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const row = accounts.find((a) => a.broker === 'mexc' && a.status === 'connected');
  if (!row) {
    res.status(400).json({ error: 'Connect MEXC in Account first.' });
    return;
  }

  let creds: { apiKey: string; apiSecret: string };
  try {
    creds = await resolveBrokerCredentials(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve exchange credentials.' });
    return;
  }

  const p = parsed.data;
  const hasTp = p.takeProfit != null && Number(p.takeProfit) > 0;
  const hasSl = p.stopLoss != null && Number(p.stopLoss) > 0;
  const wantsClear =
    (p.takeProfit != null && Number(p.takeProfit) <= 0) ||
    (p.stopLoss != null && Number(p.stopLoss) <= 0);

  if (!hasTp && !hasSl && !wantsClear) {
    res.json({
      ok: true,
      exchange: 'mexc',
      orderIds: [],
      note: 'No TP/SL provided — skipped.',
    });
    return;
  }

  try {
    await mexcAdapter.ensureTradeEnabled(creds);
    const result = await mexcAdapter.setPositionTpSl(creds, {
      symbol: p.symbol,
      positionSide: p.positionSide,
      qty: p.qty.trim(),
      takeProfit: p.takeProfit?.trim() ?? '0',
      stopLoss: p.stopLoss?.trim() ?? '0',
    });
    const partial = result.warnings.length > 0;
    res.json({
      ok: true,
      exchange: 'mexc',
      orderIds: result.orderIds,
      placed: result.placed,
      warnings: result.warnings,
      note: partial
        ? 'Stop-loss placed on MEXC; take-profit could not be set — adjust manually if needed.'
        : 'TP/SL stop orders placed on MEXC — they trigger and close the position at the specified prices.',
    });
  } catch (e) {
    const msg = clientSafeExchangeError(e, 'Trading stop failed');
    log('warn', 'MEXC trading-stop failed.', { error: msg });
    res.status(400).json({ error: msg });
  }
});
