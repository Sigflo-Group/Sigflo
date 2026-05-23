import { z } from 'zod';

export const submitReactionSchema = z.object({
  signalId: z.string().min(1).max(200),
  pair: z.string().min(1).max(50),
  side: z.string().min(1).max(20),
  setupType: z.string().min(1).max(50),
  setupScore: z.number().int().min(0).max(200),
  riskTag: z.string().max(50).nullable(),
  reaction: z.enum(['helpful', 'not_helpful']),
});
