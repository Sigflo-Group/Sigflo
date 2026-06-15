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

const ADMIN_USER_IDS: ReadonlySet<string> = new Set(
  (env.SIGFLO_BETA_ADMIN_USER_IDS ?? '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean),
);

/**
 * Requires the authenticated user to be listed in SIGFLO_BETA_ADMIN_EMAILS and/or
 * SIGFLO_BETA_ADMIN_USER_IDS. Must be used after requireAuth.
 */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const email = req.user?.email?.trim().toLowerCase();
  const userId = req.user?.userId?.trim();
  const isAdmin =
    (email != null && email.length > 0 && ADMIN_EMAILS.has(email)) ||
    (userId != null && userId.length > 0 && ADMIN_USER_IDS.has(userId));

  if (!isAdmin) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
}
