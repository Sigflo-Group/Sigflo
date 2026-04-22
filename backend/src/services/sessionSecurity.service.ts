import crypto from 'node:crypto';
import { SECURITY } from '../config/security.js';
import {
  getActiveSessionForUser,
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

export async function ensureSessionTracked(input: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionIdentifier?: string;
}) {
  const sid = input.sessionIdentifier ?? crypto.createHash('sha256').update(`${input.userId}|${input.userAgent ?? ''}|${input.ipAddress ?? ''}`).digest('hex');
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

export async function getSessionStateForUser(userId: string) {
  const current = await getActiveSessionForUser(userId);
  const sessions = await listSessionsForUser(userId);
  const stepUpVerifiedAt = current?.stepUpVerifiedAt ?? null;
  return {
    userId,
    stepUpVerifiedAt,
    stepUpValidUntil: computeStepUpValidUntilIso(stepUpVerifiedAt),
    oneTapEnabled: false,
    mfaEnabled: false,
    sessions: sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      revokedAt: s.revokedAt,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    })),
  };
}
