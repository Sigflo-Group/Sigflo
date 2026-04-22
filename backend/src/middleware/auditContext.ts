import type { NextFunction, Request, Response } from 'express';

export type RequestAuditContext = {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type RequestWithAuditContext = Request & {
  requestId?: string;
  auditContext?: RequestAuditContext;
};

export function auditContext(req: RequestWithAuditContext, _res: Response, next: NextFunction) {
  const forwarded = req.header('x-forwarded-for')?.split(',')[0]?.trim();
  req.auditContext = {
    requestId: req.requestId ?? '',
    ipAddress: forwarded || req.ip || null,
    userAgent: req.header('user-agent') ?? null,
  };
  next();
}
