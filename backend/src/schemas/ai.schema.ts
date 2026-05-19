import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(32000),
});

export const aiSuggestSchema = z.object({
  model: z.string().min(1).max(64).default('gpt-4o-mini'),
  messages: z.array(messageSchema).min(1).max(50),
  temperature: z.number().min(0).max(2).default(0.15),
  response_format: z.object({ type: z.literal('json_object') }).optional(),
}).strict();

export const aiNewsScanSchema = z.object({
  mode: z.enum(['short', 'deep']),
  focusAsset: z.string().trim().max(50).optional(),
  marketRegime: z.string().max(50).optional(),
}).strict();