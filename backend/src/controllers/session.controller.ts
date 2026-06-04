import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { hasAal2 } from '../lib/authAssurance.js';
import {
  markStepUpVerified,
  revokeSession,
  getSessionStateForUser,
  ensureSessionTracked,
  isStepUpVerificationFresh,
} from '../services/sessionSecurity.service.js';

export async function getSessionMe(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const session = await ensureSessionTracked({
    userId: req.user.userId,
    ipAddress: req.auditContext?.ipAddress ?? null,
    userAgent: req.auditContext?.userAgent ?? null,
  });
  const state = await getSessionStateForUser(req.user.userId);
  const mfaSessionActive = hasAal2(req.user.claims);
  return res.json({
    userId: req.user.userId,
    stepUp: {
      required: !isStepUpVerificationFresh(state.stepUpVerifiedAt),
      verifiedAt: state.stepUpVerifiedAt,
      validUntil: state.stepUpValidUntil,
    },
    oneTapEnabled: state.oneTapEnabled,
    mfaEnabled: mfaSessionActive,
    sessions: state.sessions,
    sessionIdentifier: session.sessionIdentifier,
  });
}

export async function postStepUp(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasAal2(req.user.claims)) {
    return res.status(403).json({
      error: 'Step-up requires two-factor authentication. Verify with your authenticator app, then try again.',
      code: 'MFA_REQUIRED',
    });
  }
  const session = await ensureSessionTracked({
    userId: req.user.userId,
    ipAddress: req.auditContext?.ipAddress ?? null,
    userAgent: req.auditContext?.userAgent ?? null,
  });
  await markStepUpVerified(req.user.userId, session.sessionIdentifier);
  const state = await getSessionStateForUser(req.user.userId);
  const mfaSessionActive = hasAal2(req.user.claims);
  return res.json({
    userId: req.user.userId,
    stepUp: {
      required: false,
      verifiedAt: state.stepUpVerifiedAt,
      validUntil: state.stepUpValidUntil,
    },
    oneTapEnabled: state.oneTapEnabled,
    mfaEnabled: mfaSessionActive,
    sessions: state.sessions,
  });
}

export async function postRevokeSession(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined;
  await revokeSession(req.user.userId, sessionId);
  return res.json({ ok: true });
}
