import { db } from '../index.js';

export type BrokerAccountRow = {
  id: string;
  userId: string;
  broker: string;
  accountLabel: string | null;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  apiKeyVaultId: string | null;
  apiSecretVaultId: string | null;
  permissions: Record<string, unknown>;
  status: string;
  isActive: boolean;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const SELECT_COLS = `
  id, user_id as "userId", broker, account_label as "accountLabel",
  api_key_encrypted as "apiKeyEncrypted", api_secret_encrypted as "apiSecretEncrypted",
  api_key_vault_id as "apiKeyVaultId", api_secret_vault_id as "apiSecretVaultId",
  permissions, status, is_active as "isActive",
  last_validated_at as "lastValidatedAt", created_at as "createdAt", updated_at as "updatedAt"
`;

export async function listBrokerAccountsForUser(userId: string): Promise<BrokerAccountRow[]> {
  const { rows } = await db.query<BrokerAccountRow>(
    `select ${SELECT_COLS} from broker_accounts where user_id = $1 order by created_at desc`,
    [userId],
  );
  return rows;
}

export async function getBrokerAccountForUser(userId: string, accountId: string): Promise<BrokerAccountRow | null> {
  const { rows } = await db.query<BrokerAccountRow>(
    `select ${SELECT_COLS} from broker_accounts where user_id = $1 and id = $2 limit 1`,
    [userId, accountId],
  );
  return rows[0] ?? null;
}

export async function deleteBrokerAccount(userId: string, broker: string): Promise<void> {
  await db.query('delete from broker_accounts where user_id = $1 and broker = $2', [userId, broker]);
}

export async function upsertBrokerAccount(input: {
  userId: string;
  broker: string;
  accountLabel?: string | null;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  apiKeyVaultId?: string | null;
  apiSecretVaultId?: string | null;
  permissions: Record<string, unknown>;
  status: string;
  isActive?: boolean;
}): Promise<BrokerAccountRow> {
  const { rows } = await db.query<BrokerAccountRow>(
    `insert into broker_accounts
      (user_id, broker, account_label, api_key_encrypted, api_secret_encrypted,
       api_key_vault_id, api_secret_vault_id, permissions, status, is_active, last_validated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10, now())
     on conflict (user_id, broker) do update
       set account_label        = excluded.account_label,
           api_key_encrypted    = excluded.api_key_encrypted,
           api_secret_encrypted = excluded.api_secret_encrypted,
           api_key_vault_id     = excluded.api_key_vault_id,
           api_secret_vault_id  = excluded.api_secret_vault_id,
           permissions          = excluded.permissions,
           status               = excluded.status,
           is_active            = excluded.is_active,
           last_validated_at    = now(),
           updated_at           = now()
     returning ${SELECT_COLS}`,
    [
      input.userId,
      input.broker,
      input.accountLabel ?? null,
      input.apiKeyEncrypted,
      input.apiSecretEncrypted,
      input.apiKeyVaultId ?? null,
      input.apiSecretVaultId ?? null,
      JSON.stringify(input.permissions ?? {}),
      input.status,
      input.isActive ?? false,
    ],
  );
  return rows[0]!;
}

/**
 * Atomically deactivate all accounts for the user then activate the specified one.
 * Uses an explicit transaction so the partial unique index never sees two actives.
 */
export async function setActiveExchange(userId: string, accountId: string): Promise<BrokerAccountRow | null> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `update broker_accounts set is_active = false, updated_at = now() where user_id = $1::uuid`,
      [userId],
    );
    const { rows } = await client.query<BrokerAccountRow>(
      `update broker_accounts
         set is_active = true, updated_at = now()
       where user_id = $1::uuid and id = $2::uuid
       returning ${SELECT_COLS}`,
      [userId, accountId],
    );
    await client.query('COMMIT');
    return rows[0] ?? null;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Transaction may already be rolled back.
    }
    throw err;
  } finally {
    client.release();
  }
}
