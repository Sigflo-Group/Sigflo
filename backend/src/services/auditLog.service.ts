import crypto from 'node:crypto';
import { insertAuditLog } from '../db/queries/auditLogs.js';

export async function writeAuditLog(input: {
  userId?: string | null;
  requestId?: string | null;
  action: string;
  objectType?: string | null;
  objectId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  outcome: string;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}) {
  const payloadHash =
    input.payload == null
      ? null
      : crypto.createHash('sha256').update(JSON.stringify(input.payload)).digest('hex');
  await insertAuditLog({
    userId: input.userId ?? null,
    requestId: input.requestId ?? null,
    action: input.action,
    objectType: input.objectType ?? null,
    objectId: input.objectId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    outcome: input.outcome,
    payloadHash,
    metadata: input.metadata ?? {},
  });
}
