import { db } from '../db/index.js';
import { decryptText, encryptText } from '../security/crypto.js';

const CREDENTIAL_CACHE_TTL_MS = 30_000;
const credentialCache = new Map<string, { value: string; expiresAt: number }>();

function getCached(key: string): string | null {
  const entry = credentialCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    credentialCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key: string, value: string): void {
  credentialCache.set(key, { value, expiresAt: Date.now() + CREDENTIAL_CACHE_TTL_MS });
}

/**
 * Encrypts a plain text credential.
 * In the new Vault-based system, this is used before sending to the Vault.
 */
export function encryptBrokerCredential(plain: string): string {
  return encryptText(plain);
}

/**
 * Decrypts a cipher text credential.
 * This is used for legacy support or when retrieving from the Vault.
 */
export function decryptBrokerCredential(cipherText: string): string {
  const cached = getCached(cipherText);
  if (cached != null) return cached;
  const decrypted = decryptText(cipherText);
  setCache(cipherText, decrypted);
  return decrypted;
}

/**
 * Retrieves a secret from Supabase Vault by its ID.
 * This function interacts with the `vault.secrets` table.
 */
export async function getSecretFromVault(vaultId: string): Promise<string | null> {
  const cached = getCached(`vault:${vaultId}`);
  if (cached != null) return cached;
  const { rows } = await db.query<{ decrypted_secret: string }>(
    'select decrypted_secret from vault.decrypted_secrets where id = $1',
    [vaultId],
  );
  const value = rows[0]?.decrypted_secret ?? null;
  if (value != null) setCache(`vault:${vaultId}`, value);
  return value;
}

/**
 * Stores a secret in Supabase Vault and returns its ID.
 */
export async function storeSecretInVault(name: string, description: string, secret: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `insert into vault.secrets (name, description, secret, key_id)
     values ($1, $2, $3, (select id from vault.keys where name = 'default'))
     returning id`,
    [name, description, secret],
  );
  return rows[0].id;
}

/**
 * Deletes a secret from Supabase Vault.
 */
export async function deleteSecretFromVault(vaultId: string): Promise<void> {
  await db.query('delete from vault.secrets where id = $1', [vaultId]);
}

export function maskBrokerSecret(value: string): string {
  if (value.length <= 8) return '********';
  return `${value.slice(0, 3)}****${value.slice(-3)}`;
}
