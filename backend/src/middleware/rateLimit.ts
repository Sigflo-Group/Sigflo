import type { Request, RequestHandler } from 'express';
import expressRateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { SECURITY } from '../config/security.js';

function standardLimiter(max: number): RequestHandler {
  return expressRateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const uid = (req as Request & { user?: { userId?: string } }).user?.userId;
      if (uid) return `u:${uid}`;
      return `ip:${ipKeyGenerator(req.ip ?? '')}`;
    },
  });
}

export const authRouteLimiter = standardLimiter(40);
export const exchangeLinkLimiter = standardLimiter(SECURITY.exchangeLinkPerMinute);
export const tradeIntentLimiter = standardLimiter(SECURITY.tradeIntentPerMinute);
export const tradeExecuteLimiter = standardLimiter(SECURITY.tradeExecutePerMinute);
export const aiLimiter = standardLimiter(30);
