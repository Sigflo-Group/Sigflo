import { db } from '../index.js';

export async function insertAuditLog(input: {
  userId?: string | null;
  requestId?: string | null;
  action: string;
  objectType?: string | null;
  objectId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  outcome: string;
  payloadHash?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.query(
    `insert into audit_logs
      (user_id, request_id, action, object_type, object_id, ip_address, user_agent, outcome, payload_hash, metadata)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
    [
      input.userId ?? null,
      input.requestId ?? null,
      input.action,
      input.objectType ?? null,
      input.objectId ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
      input.outcome,
      input.payloadHash ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}
