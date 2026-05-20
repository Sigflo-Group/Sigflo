import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'signal_quality', 'exchange_issue', 'general']),
  message: z.string().min(1).max(4000),
  screenshotUrl: z.string().url().optional().nullable(),
  route: z.string().max(500).optional().nullable(),
  browserInfo: z.record(z.unknown()).optional().default({}),
  activeExchange: z.string().max(50).optional().nullable(),
  appVersion: z.string().max(50).optional().nullable(),
});
