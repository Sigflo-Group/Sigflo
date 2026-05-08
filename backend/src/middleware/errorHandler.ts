import type { NextFunction, Request, Response } from 'express';
import { log } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request & { requestId?: string }, res: Response, _next: NextFunction) {
  const msg = err instanceof Error ? err.message : String(err);

  log('error', 'Unhandled API error', {
    requestId: req.requestId,
    error: err, // 👈 log full error object
  });

  console.error('FULL ERROR:', err); // 👈 ADD THIS

  res.status(500).json({
    error: msg, // 👈 SHOW REAL ERROR FOR NOW
    requestId: req.requestId
  });
}
