import { db } from '../index.js';

export type BrokerAccountRow = {
  id: string;
  userId: string;
  broker: string;
  accountLabel: string | null;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  permissions: Record<string, unknown>;
  status: string;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listBrokerAccountsForUser(userId: string): Promise<BrokerAccountRow[]> {
  const { rows } = await db.query<BrokerAccountRow>(
    `select id, user_id as "userId", broker, account_label as "accountLabel",
      api_key_encrypted as "apiKeyEncrypted", api_secret_encrypted as "apiSecretEncrypted",
      permissions, status, last_validated_at as "lastValidatedAt",
      created_at as "createdAt", updated_at as "updatedAt"
     from broker_accounts where user_id = $1 order by created_at desc`,
    [userId],
  );
  return rows;
}

export async function getBrokerAccountForUser(userId: string, accountId: string): Promise<BrokerAccountRow | null> {
  const { rows } = await db.query<BrokerAccountRow>(
    `select id, user_id as "userId", broker, account_label as "accountLabel",
      api_key_encrypted as "apiKeyEncrypted", api_secret_encrypted as "apiSecretEncrypted",
      permissions, status, last_validated_at as "lastValidatedAt",
      created_at as "createdAt", updated_at as "updatedAt"
      from broker_accounts where user_id = $1 and id = $2 limit 1`,
    [userId, accountId],
  );
  return rows[0] ?? null;
}

export async function upsertBrokerAccount(input: {
  userId: string;
  broker: string;
  accountLabel?: string | null;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  permissions: Record<string, unknown>;
  status: string;
}): Promise<BrokerAccountRow> {
  const { rows } = await db.query<BrokerAccountRow>(
    `insert into broker_accounts
      (user_id, broker, account_label, api_key_encrypted, api_secret_encrypted, permissions, status, last_validated_at)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7, now())
     on conflict (user_id, broker) do update
       set account_label = excluded.account_label,
           api_key_encrypted = excluded.api_key_encrypted,
           api_secret_encrypted = excluded.api_secret_encrypted,
           permissions = excluded.permissions,
           status = excluded.status,
           last_validated_at = now(),
           updated_at = now()
     returning id, user_id as "userId", broker, account_label as "accountLabel",
       api_key_encrypted as "apiKeyEncrypted", api_secret_encrypted as "apiSecretEncrypted",
       permissions, status, last_validated_at as "lastValidatedAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [
      input.userId,
      input.broker,
      input.accountLabel ?? null,
      input.apiKeyEncrypted,
      input.apiSecretEncrypted,
      JSON.stringify(input.permissions ?? {}),
      input.status,
    ],
  );
  return rows[0]!;
}
