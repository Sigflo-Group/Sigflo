import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './auth.js';
import { getSessionByIdentifier } from '../db/queries/sessions.js';
import {
  isStepUpVerificationFresh,
  resolveSessionIdentifierFromRequest,
} from '../services/sessionSecurity.service.js';

export async function requireStepUp(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const allowDevBypass =
    process.env.NODE_ENV !== 'production' &&
    (process.env.SIGFLO_ALLOW_DEV_STEP_UP_BYPASS === '1' ||
      process.env.SIGFLO_ALLOW_DEV_STEP_UP_BYPASS === 'true');
  if (allowDevBypass) {
    next();
    return;
  }

  const sid = resolveSessionIdentifierFromRequest(req);
  if (!sid) {
    res.status(403).json({ error: 'Step-up verification required.' });
    return;
  }

  const session = await getSessionByIdentifier(req.user.userId, sid);
  if (!session || session.revokedAt || !isStepUpVerificationFresh(session.stepUpVerifiedAt)) {
    res.status(403).json({ error: 'Step-up verification required.' });
    return;
  }
  next();
}
