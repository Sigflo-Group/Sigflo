import type { Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import type { AuthedRequest } from './auth.js';

/** Parsed once at module load — env vars don't change at runtime. */
const ADMIN_EMAILS: ReadonlySet<string> = new Set(
  (env.SIGFLO_BETA_ADMIN_EMAILS ?? '')
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

/**
 * Requires the authenticated user's email to be in SIGFLO_BETA_ADMIN_EMAILS.
 * Must be used after requireAuth (depends on req.user being populated).
 */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const email = req.user?.email?.trim().toLowerCase();
  if (!email || !ADMIN_EMAILS.has(email)) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
}
