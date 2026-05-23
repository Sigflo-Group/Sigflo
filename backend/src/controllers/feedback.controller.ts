import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { countFeedbackByUser, insertFeedback, listFeedback } from '../db/queries/feedback.js';
import { log } from '../lib/logger.js';

export async function postFeedback(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { category, severity, message, screenshotUrl, route, browserInfo, activeExchange, appVersion } = req.body as {
    category: string;
    severity?: string;
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
    severity,
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

/** Admin-only: paginated list of all feedback, newest first. */
export async function listFeedbackAdmin(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const category = typeof req.query.category === 'string' && req.query.category ? req.query.category : undefined;
  const cursor = typeof req.query.cursor === 'string' && req.query.cursor ? req.query.cursor : undefined;

  const rows = await listFeedback({ limit: 50, category, cursor });
  const nextCursor = rows.length === 50 ? (rows[rows.length - 1]?.createdAt ?? null) : null;

  return res.json({ feedback: rows, nextCursor });
}

/** Admin-only: top feedback submitters. */
export async function listTopReporters(res: Response) {
  const rows = await countFeedbackByUser();
  return res.json({ reporters: rows });
}
