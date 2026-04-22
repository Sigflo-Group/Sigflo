import { z } from 'zod';

export const stepUpSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
  })
  .strict();

export const revokeSessionSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
  })
  .strict();
