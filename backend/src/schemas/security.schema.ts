import { z } from 'zod';

export const auditPermissionsSchema = z.object({ accountId: z.string().uuid() }).strict();

export const rotateKeySchema = z
  .object({
    accountId: z.string().uuid(),
    apiKey: z.string().min(8).max(256),
    apiSecret: z.string().min(8).max(256),
    reason: z.string().trim().max(280).optional(),
  })
  .strict();

export const acknowledgeRiskSchema = z
  .object({ version: z.string().min(1).max(32) })
  .strict();
