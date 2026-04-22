import { Router } from 'express';
import { getTradeById, listTrades, postTradeExecute, postTradeIntent } from '../controllers/trade.controller.js';
import { requireTradeOwnership } from '../middleware/requireOwnership.js';
import { tradeExecuteLimiter, tradeIntentLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateRequest.js';
import { tradeExecuteSchema, tradeIntentSchema } from '../schemas/trade.schema.js';

export const secureTradeRouter = Router();

secureTradeRouter.post('/intent', tradeIntentLimiter, validateBody(tradeIntentSchema), postTradeIntent);
secureTradeRouter.post('/execute', tradeExecuteLimiter, validateBody(tradeExecuteSchema), postTradeExecute);
secureTradeRouter.get('/:id', requireTradeOwnership, getTradeById);
