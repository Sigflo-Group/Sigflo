import { Router } from 'express';
import { z } from 'zod';
import type { AuthedRequest } from '../middleware/auth.js';
import { getUserRiskSettings, upsertUserRiskSettings } from '../db/queries/riskSettings.js';
import { formatZodIssuesForApi } from '../lib/formatZodError.js';

export const riskRouter = Router();

const riskSettingsSchema = z.object({
  riskMode: z.enum(['Defensive', 'Balanced', 'Aggressive']),
  maxRiskPerTradePct: z.number().min(0.1).max(25),
  maxDailyLossPct: z.number().min(0.5).max(50),
  maxOpenPositions: z.number().int().min(1).max(25),
  allowLiveExecution: z.boolean(),
  requireConfirmation: z.boolean(),
  paperModeDefault: z.boolean(),
}).strict();

riskRouter.get('/settings', async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json(await getUserRiskSettings(req.user.userId));
});

riskRouter.put('/settings', async (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const parsed = riskSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssuesForApi(parsed.error.issues) });
  }
  return res.json(await upsertUserRiskSettings(req.user.userId, parsed.data));
});
