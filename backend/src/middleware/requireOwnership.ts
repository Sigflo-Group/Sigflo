import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './auth.js';
import { getTradeByIdForUser } from '../db/queries/trades.js';

export async function requireTradeOwnership(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const tradeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!tradeId) {
    res.status(400).json({ error: 'Missing trade id' });
    return;
  }
  const trade = await getTradeByIdForUser(req.user.userId, tradeId);
  if (!trade) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  next();
}
