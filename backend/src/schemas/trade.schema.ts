import { z } from 'zod';

export const tradeIntentSchema = z
  .object({
    symbol: z.string().min(3).max(32).regex(/^[A-Z0-9/_-]+$/i),
    direction: z.enum(['long', 'short']),
    positionSizeUsd: z.number().positive().max(5_000_000),
    leverage: z.number().min(1).max(125),
    stopPrice: z.number().positive().optional(),
    targetPrice: z.number().positive().optional(),
    brokerAccountId: z.string().uuid().optional(),
  })
  .strict();

export const tradeExecuteSchema = z
  .object({
    executionToken: z.string().min(16).max(500),
    idempotencyKey: z.string().min(8).max(200),
  })
  .strict();
