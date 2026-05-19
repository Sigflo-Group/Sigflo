import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './auth.js';
import { getSessionStateForUser, isStepUpVerificationFresh } from '../services/sessionSecurity.service.js';

export async function requireStepUp(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }

  const state = await getSessionStateForUser(req.user.userId);
  if (!isStepUpVerificationFresh(state.stepUpVerifiedAt)) {
    res.status(403).json({ error: 'Step-up verification required.' });
    return;
  }
  next();
}
