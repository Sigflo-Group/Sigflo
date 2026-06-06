import crypto from 'node:crypto';
import type { AuthedRequest } from '../middleware/auth.js';
import { SECURITY } from '../config/security.js';
import {
  getActiveSessionForUser,
  getSessionByIdentifier,
  listSessionsForUser,
  markStepUpForSession,
  revokeSessionById,
  upsertUserSession,
} from '../db/queries/sessions.js';

function computeStepUpValidUntilIso(verifiedAtIso: string | null): string | null {
  if (!verifiedAtIso) return null;
  const t = Date.parse(verifiedAtIso);
  if (!Number.isFinite(t)) return null;
  return new Date(t + SECURITY.stepUpTtlSec * 1000).toISOString();
}

export function isStepUpVerificationFresh(verifiedAtIso: string | null): boolean {
  const until = computeStepUpValidUntilIso(verifiedAtIso);
  if (!until) return false;
  return Date.now() < Date.parse(until);
}

export function resolveSessionIdentifier(input: {
  userId: string;
  sessionIdentifier?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): string {
  if (input.sessionIdentifier?.trim()) return input.sessionIdentifier.trim();
  return crypto
    .createHash('sha256')
    .update(`${input.userId}|${input.userAgent ?? ''}|${input.ipAddress ?? ''}`)
    .digest('hex');
}

export function resolveSessionIdentifierFromRequest(req: AuthedRequest): string | null {
  if (!req.user) return null;
  return resolveSessionIdentifier({
    userId: req.user.userId,
    sessionIdentifier: req.user.sessionIdentifier,
    ipAddress: req.auditContext?.ipAddress ?? null,
    userAgent: req.auditContext?.userAgent ?? null,
  });
}

export async function ensureSessionTracked(input: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionIdentifier?: string;
}) {
  const sid = resolveSessionIdentifier(input);
  const existing = await getSessionByIdentifier(input.userId, sid);
  if (existing?.revokedAt) {
    throw new Error('SESSION_REVOKED');
  }
  return upsertUserSession({
    userId: input.userId,
    sessionIdentifier: sid,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });
}

export async function markStepUpVerified(userId: string, sessionIdentifier: string) {
  await markStepUpForSession(userId, sessionIdentifier);
}

export async function revokeSession(userId: string, sessionId?: string) {
  await revokeSessionById(userId, sessionId);
}

export async function getSessionStateForUser(userId: string, sessionIdentifier?: string) {
  const session = sessionIdentifier
    ? await getSessionByIdentifier(userId, sessionIdentifier)
    : await getActiveSessionForUser(userId);
  const sessions = await listSessionsForUser(userId);
  const stepUpVerifiedAt = session && !session.revokedAt ? session.stepUpVerifiedAt : null;
  return {
    userId,
    stepUpVerifiedAt,
    stepUpValidUntil: computeStepUpValidUntilIso(stepUpVerifiedAt),
    oneTapEnabled: false,
    sessions: sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      revokedAt: s.revokedAt,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    })),
  };
}

export async function getStepUpStateForRequest(req: AuthedRequest) {
  const sid = resolveSessionIdentifierFromRequest(req);
  if (!sid || !req.user) return { required: true, verifiedAt: null as string | null, validUntil: null as string | null };
  const session = await getSessionByIdentifier(req.user.userId, sid);
  if (!session || session.revokedAt) {
    return { required: true, verifiedAt: null, validUntil: null };
  }
  const verifiedAt = session.stepUpVerifiedAt;
  return {
    required: !isStepUpVerificationFresh(verifiedAt),
    verifiedAt,
    validUntil: computeStepUpValidUntilIso(verifiedAt),
  };
}
