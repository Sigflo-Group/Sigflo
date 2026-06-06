import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './auth.js';
import { SECURITY } from '../config/security.js';
import { consumeIdempotencyKey } from '../utils/idempotency.js';

export async function requireIdempotency(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const raw =
    req.header('x-idempotency-key')?.trim() ||
    (typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey.trim() : '');
  if (!raw || raw.length < 8 || raw.length > 200) {
    res.status(400).json({ error: 'Idempotency-Key header (or body idempotencyKey) is required.' });
    return;
  }

  const result = await consumeIdempotencyKey(
    `${req.user.userId}:${raw}`,
    SECURITY.idempotencyTtlSec * 1000,
  );
  if (result === 'unavailable') {
    res.status(503).json({ error: 'Idempotency store unavailable. Try again shortly.' });
    return;
  }
  if (result === 'duplicate') {
    res.status(409).json({ error: 'Duplicate request.' });
    return;
  }
  next();
}
