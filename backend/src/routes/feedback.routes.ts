import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { listFeedbackAdmin, postFeedback } from '../controllers/feedback.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { submitFeedbackSchema } from '../schemas/feedback.schema.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feedback submissions. Please wait a minute.' },
});

export const feedbackRouter = Router();

// User: submit feedback
feedbackRouter.post('/', feedbackLimiter, validateBody(submitFeedbackSchema), postFeedback);

// Admin: read all feedback (requires SIGFLO_BETA_ADMIN_EMAILS to include the caller's email)
feedbackRouter.get('/', requireAdmin, (req, res, next) => {
  listFeedbackAdmin(req as Parameters<typeof listFeedbackAdmin>[0], res).catch(next);
});
