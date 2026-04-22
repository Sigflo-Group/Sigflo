import type { NextFunction, Request, Response } from 'express';
import { log } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request & { requestId?: string }, res: Response, _next: NextFunction) {
  const msg = err instanceof Error ? err.message : String(err);
  log('error', 'Unhandled API error', { requestId: req.requestId, error: msg });
  const safe = res.statusCode >= 400 && res.statusCode < 500 ? msg : 'Internal server error';
  res.status(res.statusCode >= 400 ? res.statusCode : 500).json({ error: safe, requestId: req.requestId });
}
