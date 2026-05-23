import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { upsertSignalReaction } from '../db/queries/signalReaction.js';
import { log } from '../lib/logger.js';

export async function postSignalReaction(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { signalId, pair, side, setupType, setupScore, riskTag, reaction } = req.body as {
    signalId: string;
    pair: string;
    side: string;
    setupType: string;
    setupScore: number;
    riskTag: string | null;
    reaction: string;
  };

  await upsertSignalReaction({
    userId: req.user.userId,
    signalId,
    pair,
    side,
    setupType,
    setupScore,
    riskTag,
    reaction,
  });

  log('info', 'Signal reaction recorded.', { userId: req.user.userId, signalId, reaction });

  return res.status(201).json({ ok: true });
}
