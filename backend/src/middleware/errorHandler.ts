import type { NextFunction, Request, Response } from 'express';
import { log } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request & { requestId?: string }, res: Response, _next: NextFunction) {
  const msg = err instanceof Error ? err.message : String(err);

  // Error objects are non-enumerable so JSON.stringify gives {}. Serialize
  // message + stack explicitly so log lines are actually useful.
  log('error', 'Unhandled API error', {
    requestId: req.requestId,
    error: err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : String(err),
  });

  const safeMessage = 'An internal error occurred';
  res.status(500).json({
    error: safeMessage,
    requestId: req.requestId,
  });
}
