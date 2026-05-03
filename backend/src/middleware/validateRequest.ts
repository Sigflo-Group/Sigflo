import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') || 'Invalid request payload' });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateParams(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid route parameters' });
      return;
    }
    req.params = parsed.data as Request['params'];
    next();
  };
}
