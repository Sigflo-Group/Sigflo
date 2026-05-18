import { Router } from 'express';
import { z } from 'zod';
import type { AuthedRequest } from '../middleware/auth.js';
import { formatZodIssuesForApi } from '../lib/formatZodError.js';
import { deleteExitWatchByLeg, listExitWatchesForUser, upsertExitWatch } from '../repositories/exitWatchRepo.js';

export const exitWatchRouter = Router();

const safeguardsSchema = z.object({
  maxLossPct: z.number(),
  minProfitBeforeTrimPct: z.number(),
  allowPartialExits: z.boolean(),
  allowFullAutoClose: z.boolean(),
});

const thresholdsSchema = z
  .object({
    stopMain: z.number().optional(),
    stopMid: z.number().optional(),
    stopPnl: z.number().optional(),
    stopPnlSp: z.number().optional(),
    trimMain: z.number().optional(),
    trimMid: z.number().optional(),
    trimMom: z.number().optional(),
    trimLo: z.number().optional(),
    trimPnl: z.number().optional(),
  })
  .optional()
  .nullable();

const upsertSchema = z.object({
  enabled: z.boolean(),
  symbol: z.string().min(4).max(32),
  side: z.enum(['long', 'short']),
  positionIdx: z.number().int().min(0).max(2).default(0),
  stopPrice: z.number().positive().finite(),
  targetPrice: z.number().positive().finite(),
  trendAlignment: z.number().finite(),
  momentumQuality: z.number().finite(),
  strategyPreset: z.enum(['protect_profit', 'trend_follow', 'tight_risk', 'custom']),
  customStrategyThresholds: thresholdsSchema,
  safeguards: safeguardsSchema,
  lastGuidanceState: z.enum(['hold', 'trim', 'exit']).default('hold'),
  exchange: z.enum(['bybit']).optional(),
  market: z.enum(['linear']).optional(),
});

function serializeWatch(row: Awaited<ReturnType<typeof listExitWatchesForUser>>[number]) {
  return {
    id: row.id,
    exchange: row.exchange,
    market: row.market,
    enabled: row.enabled,
    symbol: row.symbol,
    side: row.side,
    positionIdx: row.position_idx,
    stopPrice: row.stop_price,
    targetPrice: row.target_price,
    trendAlignment: row.trend_alignment,
    momentumQuality: row.momentum_quality,
    strategyPreset: row.strategy_preset,
    customStrategyThresholds: row.custom_thresholds,
    safeguards: row.safeguards,
    lastGuidanceState: row.last_guidance_state,
    lastError: row.last_error,
    lastCheckedAt: row.last_checked_at?.toISOString() ?? null,
    lastActionAt: row.last_action_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString(),
  };
}

exitWatchRouter.get('/', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const rows = await listExitWatchesForUser(req.user.userId);
  res.json({ watches: rows.map(serializeWatch) });
});

exitWatchRouter.put('/', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const p = parsed.data;
  const row = await upsertExitWatch(req.user.userId, {
    exchange: p.exchange,
    market: p.market,
    enabled: p.enabled,
    symbol: p.symbol,
    side: p.side,
    positionIdx: p.positionIdx,
    stopPrice: p.stopPrice,
    targetPrice: p.targetPrice,
    trendAlignment: p.trendAlignment,
    momentumQuality: p.momentumQuality,
    strategyPreset: p.strategyPreset,
    customThresholds: p.customStrategyThresholds ?? null,
    safeguards: p.safeguards,
    lastGuidanceState: p.lastGuidanceState,
  });

  res.json({ watch: serializeWatch(row) });
});

const deleteQuerySchema = z.object({
  exchange: z.enum(['bybit']).default('bybit'),
  symbol: z.string().min(4).max(32),
  side: z.enum(['long', 'short']),
  positionIdx: z.coerce.number().int().min(0).max(2).default(0),
});

exitWatchRouter.delete('/', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = deleteQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
    return;
  }

  const p = parsed.data;
  const ok = await deleteExitWatchByLeg(req.user.userId, {
    exchange: p.exchange,
    symbol: p.symbol,
    side: p.side,
    positionIdx: p.positionIdx,
  });
  if (!ok) {
    res.status(404).json({ error: 'No watch matched that leg.' });
    return;
  }
  res.status(204).send();
});
