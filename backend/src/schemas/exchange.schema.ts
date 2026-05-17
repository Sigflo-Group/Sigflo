import { z } from 'zod';

export const linkExchangeSchema = z
  .object({
    broker: z.enum(['bybit', 'mexc']),
    apiKey: z.string().min(8).max(256),
    apiSecret: z.string().min(8).max(256),
    accountLabel: z.string().trim().max(120).optional(),
  })
  .strict();

export const revalidateExchangeSchema = z
  .object({
    accountId: z.string().uuid(),
  })
  .strict();
