import { Router } from 'express';
import {
  getSecuritySummary,
  postAuditPermissions,
  postRotateKey,
  postAcknowledgeRisk,
  getRiskAcknowledgement,
} from '../controllers/security.controller.js';
import { requireStepUp } from '../middleware/requireStepUp.js';
import { exchangeLinkLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateRequest.js';
import {
  auditPermissionsSchema,
  rotateKeySchema,
  acknowledgeRiskSchema,
} from '../schemas/security.schema.js';

export const securityRouter = Router();

securityRouter.get('/summary', getSecuritySummary);
securityRouter.post('/audit-permissions', exchangeLinkLimiter, validateBody(auditPermissionsSchema), postAuditPermissions);
securityRouter.post('/rotate-key', exchangeLinkLimiter, requireStepUp, validateBody(rotateKeySchema), postRotateKey);
securityRouter.post('/acknowledge-risk', validateBody(acknowledgeRiskSchema), postAcknowledgeRisk);
securityRouter.get('/risk-acknowledgement', getRiskAcknowledgement);
