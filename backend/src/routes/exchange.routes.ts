import { Router } from 'express';
import {
  getExchangeStatus,
  postLinkExchange,
  postRevalidateExchange,
  deleteExchange,
} from '../controllers/exchange.controller.js';
import { requireStepUp } from '../middleware/requireStepUp.js';
import { exchangeLinkLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateRequest.js';
import { linkExchangeSchema, revalidateExchangeSchema } from '../schemas/exchange.schema.js';

export const exchangeRouter = Router();

exchangeRouter.get('/status', getExchangeStatus);
exchangeRouter.post('/link', exchangeLinkLimiter, requireStepUp, validateBody(linkExchangeSchema), postLinkExchange);
exchangeRouter.post('/revalidate', exchangeLinkLimiter, requireStepUp, validateBody(revalidateExchangeSchema), postRevalidateExchange);
exchangeRouter.delete('/:broker', deleteExchange);
