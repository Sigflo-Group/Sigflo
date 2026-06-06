import type { Request, Response, NextFunction } from 'express';
import { log } from '../lib/logger.js';
import { upsertUser } from '../repositories/usersRepo.js';
import { verifySupabaseAccessToken } from '../services/supabaseAuth.service.js';
import {
  resolveSessionIdentifier,
} from '../services/sessionSecurity.service.js';
import { getSessionByIdentifier } from '../db/queries/sessions.js';
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

async function isRevokedSession(
  userId: string,
  sessionIdentifier: string,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<boolean> {
  const sid = resolveSessionIdentifier({ userId, sessionIdentifier, ipAddress, userAgent });
  const row = await getSessionByIdentifier(userId, sid);
  return Boolean(row?.revokedAt);
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (process.env.NODE_ENV === 'production' && req.header('x-user-id')) {
      res.status(401).json({ error: 'Sign in required.' });
      return;
    }

    const token = bearerToken(req);
    const ipAddress = req.auditContext?.ipAddress ?? null;
    const userAgent = req.auditContext?.userAgent ?? null;

    if (token) {
      const verified = await verifySupabaseAccessToken(token);
      if (!verified) {
        res.status(401).json({ error: 'Invalid or expired session.' });
        return;
      }
      const jwtSessionId =
        typeof verified.claims?.session_id === 'string' ? verified.claims.session_id : undefined;
      if (await isRevokedSession(verified.id, jwtSessionId ?? '', ipAddress, userAgent)) {
        res.status(401).json({ error: 'Session has been revoked. Sign in again.' });
        return;
      }
      const email = verified.email ?? `${verified.id}@users.supabase`;
      await upsertUser(verified.id, email);
      req.user = {
        userId: verified.id,
        email: verified.email,
        claims: verified.claims,
        sessionIdentifier: jwtSessionId,
      };
      next();
      return;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const hasJwtConfig = Boolean(env.SUPABASE_JWT_SECRET || env.SUPABASE_URL);
    if (!isProd && !hasJwtConfig) {
      const devUserId = req.header('x-user-id')?.trim();
      if (devUserId) {
        const devEmail = req.header('x-user-email')?.trim() || `${devUserId}@dev.local`;
        await upsertUser(devUserId, devEmail);
        req.user = { userId: devUserId, email: devEmail };
        next();
        return;
      }
    }

    log('warn', 'Auth rejected: missing bearer token.');
    res.status(401).json({ error: 'Sign in required.' });
  } catch (error) {
    next(error);
  }
}
