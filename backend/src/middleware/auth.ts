import type { Request, Response, NextFunction } from 'express';
import { log } from '../lib/logger.js';
import { upsertUser } from '../repositories/usersRepo.js';
import { verifySupabaseAccessToken } from '../services/supabaseAuth.service.js';
import type { RequestAuditContext } from './auditContext.js';

export type UserContext = {
  userId: string;
  email?: string;
  claims?: Record<string, unknown>;
  sessionIdentifier?: string;
};

export type AuthedRequest = Request & {
  user?: UserContext;
  requestId?: string;
  auditContext?: RequestAuditContext;
};

function bearerToken(req: Request): string | null {
  const raw = req.header('authorization')?.trim();
  if (!raw?.toLowerCase().startsWith('bearer ')) return null;
  return raw.slice(7).trim() || null;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (process.env.NODE_ENV === 'production' && req.header('x-user-id')) {
      res.status(401).json({ error: 'Sign in required.' });
      return;
    }

    const token = bearerToken(req);

    if (token) {
      const verified = await verifySupabaseAccessToken(token);
      if (!verified) {
        res.status(401).json({ error: 'Invalid or expired session.' });
        return;
      }
      const email = verified.email ?? `${verified.id}@users.supabase`;
      await upsertUser(verified.id, email);
      req.user = {
        userId: verified.id,
        email: verified.email,
        claims: verified.claims,
        sessionIdentifier: typeof verified.claims?.session_id === 'string' ? verified.claims.session_id : undefined,
      };
      next();
      return;
    }

    log('warn', 'Auth rejected: missing bearer token.');
    res.status(401).json({ error: 'Sign in required.' });
  } catch (error) {
    next(error);
  }
}
