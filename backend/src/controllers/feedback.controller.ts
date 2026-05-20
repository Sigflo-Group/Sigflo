import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { insertFeedback } from '../db/queries/feedback.js';
import { log } from '../lib/logger.js';

export async function postFeedback(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { category, message, screenshotUrl, route, browserInfo, activeExchange, appVersion } = req.body as {
    category: string;
    message: string;
    screenshotUrl?: string | null;
    route?: string | null;
    browserInfo?: Record<string, unknown>;
    activeExchange?: string | null;
    appVersion?: string | null;
  };

  const row = await insertFeedback({
    userId: req.user.userId,
    category,
    message,
    screenshotUrl,
    route,
    browserInfo: browserInfo ?? {},
    activeExchange,
    appVersion,
  });

  log('info', 'Feedback submitted.', { userId: req.user.userId, category, feedbackId: row.id });

  return res.status(201).json({ id: row.id, createdAt: row.createdAt });
}
