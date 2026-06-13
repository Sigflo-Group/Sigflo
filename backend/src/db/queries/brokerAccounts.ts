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

/** Single active + connected exchange for this user (enforced by `is_active` + partial unique index). */
export async function getActiveBrokerAccount(userId: string): Promise<BrokerAccountRow | null> {
  const accounts = await listBrokerAccountsForUser(userId);
  return accounts.find((a) => a.status === 'connected' && a.isActive) ?? null;
}

/** Connected credentials for a specific venue (manage-mode / venue-specific routes). */
export async function getConnectedBrokerAccount(
  userId: string,
  broker: string,
): Promise<BrokerAccountRow | null> {
  const accounts = await listBrokerAccountsForUser(userId);
  return accounts.find((a) => a.broker === broker && a.status === 'connected') ?? null;
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
 * Uses a CTE so both updates happen in one round-trip with no gap where zero are active.
 */
export async function setActiveExchange(userId: string, accountId: string): Promise<BrokerAccountRow | null> {
  const { rows } = await db.query<BrokerAccountRow>(
    `with deactivate as (
       update broker_accounts set is_active = false, updated_at = now()
       where user_id = $1
     )
     update broker_accounts
       set is_active = true, updated_at = now()
     where user_id = $1 and id = $2
     returning ${SELECT_COLS}`,
    [userId, accountId],
  );
  return rows[0] ?? null;
}
