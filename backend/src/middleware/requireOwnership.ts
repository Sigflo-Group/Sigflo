import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './auth.js';
import { getTradeByIdForUser, type TradeRow } from '../db/queries/trades.js';

// Extend AuthedRequest so downstream handlers can read the verified trade
// without re-fetching, which would be an unguarded second DB hit.
export type TradeOwnershipRequest = AuthedRequest & { verifiedTrade: TradeRow };

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
  (req as TradeOwnershipRequest).verifiedTrade = trade;
  next();
}
