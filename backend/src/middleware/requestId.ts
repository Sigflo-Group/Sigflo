import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';

export type RequestWithId = Request & { requestId?: string };

export function requestId(req: RequestWithId, res: Response, next: NextFunction) {
  const incoming = req.header('x-request-id')?.trim();
  const id = incoming && incoming.length <= 120 ? incoming : crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
