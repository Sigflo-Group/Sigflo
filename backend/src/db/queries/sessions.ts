import { db } from '../index.js';

export type UserSessionRow = {
  id: string;
  userId: string;
  sessionIdentifier: string;
  stepUpVerifiedAt: string | null;
  revokedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function upsertUserSession(input: {
  userId: string;
  sessionIdentifier: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const { rows } = await db.query<UserSessionRow>(
    `insert into user_sessions (user_id, session_identifier, ip_address, user_agent)
     values ($1,$2,$3,$4)
     on conflict (user_id, session_identifier) do update
       set ip_address = excluded.ip_address,
           user_agent = excluded.user_agent,
           revoked_at = null,
           updated_at = now()
     returning id, user_id as "userId", session_identifier as "sessionIdentifier",
      step_up_verified_at as "stepUpVerifiedAt",
      revoked_at as "revokedAt", ip_address as "ipAddress", user_agent as "userAgent",
      created_at as "createdAt", updated_at as "updatedAt"`,
    [input.userId, input.sessionIdentifier, input.ipAddress ?? null, input.userAgent ?? null],
  );
  return rows[0]!;
}

export async function getActiveSessionForUser(userId: string): Promise<UserSessionRow | null> {
  const { rows } = await db.query<UserSessionRow>(
    `select id, user_id as "userId", session_identifier as "sessionIdentifier",
      step_up_verified_at as "stepUpVerifiedAt",
      revoked_at as "revokedAt", ip_address as "ipAddress", user_agent as "userAgent",
      created_at as "createdAt", updated_at as "updatedAt"
     from user_sessions
     where user_id = $1 and revoked_at is null
     order by updated_at desc limit 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function listSessionsForUser(userId: string): Promise<UserSessionRow[]> {
  const { rows } = await db.query<UserSessionRow>(
    `select id, user_id as "userId", session_identifier as "sessionIdentifier",
      step_up_verified_at as "stepUpVerifiedAt",
      revoked_at as "revokedAt", ip_address as "ipAddress", user_agent as "userAgent",
      created_at as "createdAt", updated_at as "updatedAt"
     from user_sessions where user_id = $1 order by updated_at desc`,
    [userId],
  );
  return rows;
}

export async function markStepUpForSession(userId: string, sessionIdentifier: string) {
  await db.query(
    `update user_sessions
     set step_up_verified_at = now(), updated_at = now()
     where user_id = $1 and session_identifier = $2`,
    [userId, sessionIdentifier],
  );
}

export async function revokeSessionById(userId: string, sessionId?: string) {
  if (sessionId) {
    await db.query(`update user_sessions set revoked_at = now(), updated_at = now() where user_id = $1 and id = $2`, [userId, sessionId]);
    return;
  }
  await db.query(`update user_sessions set revoked_at = now(), updated_at = now() where user_id = $1 and revoked_at is null`, [userId]);
}
