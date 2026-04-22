import { Router } from 'express';
import { getSessionMe, postRevokeSession, postStepUp } from '../controllers/session.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { revokeSessionSchema, stepUpSchema } from '../schemas/session.schema.js';

export const sessionRouter = Router();

sessionRouter.get('/me', getSessionMe);
sessionRouter.post('/step-up', validateBody(stepUpSchema), postStepUp);
sessionRouter.post('/revoke', validateBody(revokeSessionSchema), postRevokeSession);
