import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { postFeedback } from '../controllers/feedback.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { submitFeedbackSchema } from '../schemas/feedback.schema.js';

const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feedback submissions. Please wait a minute.' },
});

export const feedbackRouter = Router();

feedbackRouter.post('/', feedbackLimiter, validateBody(submitFeedbackSchema), postFeedback);
