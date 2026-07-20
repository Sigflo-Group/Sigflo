import { createHash } from 'node:crypto';
import { db } from '../db/index.js';
import { log } from '../lib/logger.js';

export type IdempotencyState =
  | { kind: 'missing' }
  | { kind: 'processing' }
  | { kind: 'succeeded'; response: unknown }
  | { kind: 'failed'; error: string | null }
  | { kind: 'conflict' }
  | { kind: 'unavailable' };

export type IdempotencyBeginResult =
  | { kind: 'accepted' }
  | Exclude<IdempotencyState, { kind: 'missing' }>;

export type IdempotencyConsumeResult = 'accepted' | 'duplicate' | 'unavailable';

type IdempotencyRow = {
  requestHash: string | null;
  status: 'processing' | 'succeeded' | 'failed';
  responseJson: unknown | null;
  errorText: string | null;
};

export function hashIdempotencyRequest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function mapExisting(row: IdempotencyRow | undefined, requestHash: string): IdempotencyState {
  if (!row) return { kind: 'missing' };
  if (!row.requestHash || row.requestHash !== requestHash) return { kind: 'conflict' };
  if (row.status === 'succeeded') return { kind: 'succeeded', response: row.responseJson };
  if (row.status === 'failed') return { kind: 'failed', error: row.errorText };
  return { kind: 'processing' };
}

export async function inspectIdempotentRequest(key: string, requestHash: string): Promise<IdempotencyState> {
  try {
    const { rows } = await db.query<IdempotencyRow>(
      `select request_hash as "requestHash", status,
              response_json as "responseJson", error_text as "errorText"
       from idempotency_keys
       where key = $1 and expires_at > now()
       limit 1`,
      [key],
    );
    return mapExisting(rows[0], requestHash);
  } catch (error) {
    log('error', 'Idempotency store unavailable while inspecting request.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { kind: 'unavailable' };
  }
}

export async function beginIdempotentRequest(input: {
  key: string;
  requestHash: string;
  ttlMs: number;
}): Promise<IdempotencyBeginResult> {
  const expiresAt = new Date(Date.now() + input.ttlMs).toISOString();
  try {
    const { rowCount } = await db.query(
      `insert into idempotency_keys
         (key, expires_at, request_hash, status, response_json, error_text, updated_at)
       values ($1, $2, $3, 'processing', null, null, now())
       on conflict (key) do nothing`,
      [input.key, expiresAt, input.requestHash],
    );
    if ((rowCount ?? 0) > 0) {
      void db.query('delete from idempotency_keys where expires_at < now()').catch(() => {});
      return { kind: 'accepted' };
    }

    const { rows: recycled } = await db.query<IdempotencyRow>(
      `update idempotency_keys
       set expires_at = $2,
           request_hash = $3,
           status = 'processing',
           response_json = null,
           error_text = null,
           updated_at = now()
       where key = $1 and expires_at <= now()
       returning request_hash as "requestHash", status,
                 response_json as "responseJson", error_text as "errorText"`,
      [input.key, expiresAt, input.requestHash],
    );
    if (recycled.length > 0) return { kind: 'accepted' };

    const { rows } = await db.query<IdempotencyRow>(
      `select request_hash as "requestHash", status,
              response_json as "responseJson", error_text as "errorText"
       from idempotency_keys
       where key = $1
       limit 1`,
      [input.key],
    );
    const state = mapExisting(rows[0], input.requestHash);
    return state.kind === 'missing' ? { kind: 'processing' } : state;
  } catch (error) {
    log('error', 'Idempotency store unavailable; rejecting duplicate-risk request.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { kind: 'unavailable' };
  }
}

/**
 * Backwards-compatible one-shot consume API used by generic idempotency middleware.
 * It intentionally fingerprints only the fully-scoped key, preserving the previous
 * behavior where any reuse of that key within the TTL is treated as a duplicate.
 */
export async function consumeIdempotencyKey(key: string, ttlMs: number): Promise<IdempotencyConsumeResult> {
  const result = await beginIdempotentRequest({
    key,
    requestHash: hashIdempotencyRequest({ legacyKey: key }),
    ttlMs,
  });

  if (result.kind === 'accepted') return 'accepted';
  if (result.kind === 'unavailable') return 'unavailable';
  return 'duplicate';
}

export async function completeIdempotentRequest(
  key: string,
  requestHash: string,
  response: unknown,
): Promise<boolean> {
  try {
    const { rowCount } = await db.query(
      `update idempotency_keys
       set status = 'succeeded', response_json = $3::jsonb, error_text = null, updated_at = now()
       where key = $1 and request_hash = $2 and status = 'processing'`,
      [key, requestHash, JSON.stringify(response)],
    );
    return (rowCount ?? 0) > 0;
  } catch (error) {
    log('error', 'Failed to persist idempotent success response.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function failIdempotentRequest(
  key: string,
  requestHash: string,
  errorText: string,
): Promise<boolean> {
  try {
    const { rowCount } = await db.query(
      `update idempotency_keys
       set status = 'failed', error_text = $3, updated_at = now()
       where key = $1 and request_hash = $2 and status = 'processing'`,
      [key, requestHash, errorText.slice(0, 1000)],
    );
    return (rowCount ?? 0) > 0;
  } catch (error) {
    log('error', 'Failed to persist idempotent failure state.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
