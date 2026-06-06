import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { hasAal2, isMfaFresh } from '../lib/authAssurance.js';
import { SECURITY } from '../config/security.js';
import {
  markStepUpVerified,
  revokeSession,
  getSessionStateForUser,
  ensureSessionTracked,
  resolveSessionIdentifierFromRequest,
  getStepUpStateForRequest,
} from '../services/sessionSecurity.service.js';

export async function getSessionMe(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const sid = resolveSessionIdentifierFromRequest(req);
  try {
    const session = await ensureSessionTracked({
      userId: req.user.userId,
      sessionIdentifier: req.user.sessionIdentifier,
      ipAddress: req.auditContext?.ipAddress ?? null,
      userAgent: req.auditContext?.userAgent ?? null,
    });
    const state = await getSessionStateForUser(req.user.userId, sid ?? session.sessionIdentifier);
    const stepUp = await getStepUpStateForRequest(req);
    const mfaSessionActive = hasAal2(req.user.claims);
    return res.json({
      userId: req.user.userId,
      stepUp,
      oneTapEnabled: state.oneTapEnabled,
      mfaEnabled: mfaSessionActive,
      sessions: state.sessions,
      sessionIdentifier: session.sessionIdentifier,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'SESSION_REVOKED') {
      return res.status(401).json({ error: 'Session has been revoked. Sign in again.' });
    }
    throw e;
  }
}

export async function postStepUp(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasAal2(req.user.claims)) {
    return res.status(403).json({
      error: 'Step-up requires two-factor authentication. Verify with your authenticator app, then try again.',
      code: 'MFA_REQUIRED',
    });
  }
  if (!isMfaFresh(req.user.claims, SECURITY.mfaFreshnessSec)) {
    return res.status(403).json({
      error: 'Step-up requires a fresh authenticator verification. Enter your 6-digit code and try again.',
      code: 'MFA_FRESH_REQUIRED',
    });
  }
  const sid = resolveSessionIdentifierFromRequest(req);
  if (!sid) {
    return res.status(403).json({ error: 'Unable to resolve session for step-up.' });
  }
  try {
    const session = await ensureSessionTracked({
      userId: req.user.userId,
      sessionIdentifier: req.user.sessionIdentifier,
      ipAddress: req.auditContext?.ipAddress ?? null,
      userAgent: req.auditContext?.userAgent ?? null,
    });
    await markStepUpVerified(req.user.userId, session.sessionIdentifier);
    const state = await getSessionStateForUser(req.user.userId, sid);
    const stepUp = await getStepUpStateForRequest(req);
    const mfaSessionActive = hasAal2(req.user.claims);
    return res.json({
      userId: req.user.userId,
      stepUp: { ...stepUp, required: false },
      oneTapEnabled: state.oneTapEnabled,
      mfaEnabled: mfaSessionActive,
      sessions: state.sessions,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'SESSION_REVOKED') {
      return res.status(401).json({ error: 'Session has been revoked. Sign in again.' });
    }
    throw e;
  }
}

export async function postRevokeSession(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined;
  await revokeSession(req.user.userId, sessionId);
  return res.json({ ok: true });
}
