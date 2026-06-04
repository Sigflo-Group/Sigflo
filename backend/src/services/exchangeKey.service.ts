import { db } from '../db/index.js';
import { decryptText, encryptText } from '../security/crypto.js';

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
  return decryptText(cipherText);
}

/**
 * Retrieves a secret from Supabase Vault by its ID.
 * This function interacts with the `vault.secrets` table.
 */
export async function getSecretFromVault(vaultId: string): Promise<string | null> {
  const { rows } = await db.query<{ decrypted_secret: string }>(
    'select decrypted_secret from vault.decrypted_secrets where id = $1',
    [vaultId],
  );
  return rows[0]?.decrypted_secret ?? null;
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
