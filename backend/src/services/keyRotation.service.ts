import { db } from '../db/index.js';
import { log } from '../lib/logger.js';
import { encryptBrokerCredential } from './exchangeKey.service.js';
import { getAdapter } from '../core/exchange-registry.js';
import type { ExchangeId } from '../exchanges/types.js';
import { upsertBrokerAccount, getBrokerAccountForUser } from '../db/queries/brokerAccounts.js';
import { writeAuditLog } from './auditLog.service.js';

export type KeyRotationInput = {
  userId: string;
  accountId: string;
  newApiKey: string;
  newApiSecret: string;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export type KeyRotationResult =
  | { ok: true; accountId: string }
  | { ok: false; error: string };

export async function rotateExchangeKey(input: KeyRotationInput): Promise<KeyRotationResult> {
  const { userId, accountId, newApiKey, newApiSecret, reason, ipAddress, userAgent, requestId } = input;

  const account = await getBrokerAccountForUser(userId, accountId);
  if (!account) {
    return { ok: false, error: 'Exchange account not found.' };
  }

  const broker = account.broker as ExchangeId;

  let validation: Awaited<ReturnType<ReturnType<typeof getAdapter>['validateReadOnly']>>;
  try {
    const adapter = getAdapter(broker);
    validation = await adapter.validateReadOnly({ apiKey: newApiKey, apiSecret: newApiSecret });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log('warn', 'Key rotation — validation threw.', { userId, broker, error: msg });
    return { ok: false, error: `Validation failed: ${msg}` };
  }

  if (!validation.ok) {
    await writeAuditLog({
      userId,
      requestId,
      action: 'exchange.key_rotation',
      objectType: 'broker_account',
      objectId: accountId,
      outcome: 'failure',
      payload: { broker },
      ipAddress,
      userAgent,
      metadata: { reason: validation.message },
    });
    return { ok: false, error: validation.message };
  }

  await upsertBrokerAccount({
    userId,
    broker,
    accountLabel: account.accountLabel,
    apiKeyEncrypted: encryptBrokerCredential(newApiKey),
    apiSecretEncrypted: encryptBrokerCredential(newApiSecret),
    permissions: account.permissions ?? {},
    status: 'connected',
    isActive: account.isActive,
  });

  await db.query(
    `insert into public.key_rotation_log
       (user_id, broker_account_id, exchange, reason, initiated_by, ip_address, user_agent)
     values ($1, $2, $3, $4, 'user', $5, $6)`,
    [userId, accountId, broker, reason ?? null, ipAddress ?? null, userAgent ?? null],
  );

  await writeAuditLog({
    userId,
    requestId,
    action: 'exchange.key_rotation',
    objectType: 'broker_account',
    objectId: accountId,
    outcome: 'success',
    payload: { broker },
    ipAddress,
    userAgent,
    metadata: { reason: reason ?? 'user_initiated' },
  });

  log('info', 'API key rotated successfully.', { userId, broker, accountId });

  return { ok: true, accountId };
}
