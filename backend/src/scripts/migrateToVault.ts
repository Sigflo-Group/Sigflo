import { db } from '../db/index.js';
import { listBrokerAccountsForUser, upsertBrokerAccount } from '../db/queries/brokerAccounts.js';
import { listIntegrations, upsertIntegration } from '../repositories/integrationsRepo.js';
import { decryptBrokerCredential, storeSecretInVault } from '../services/exchangeKey.service.js';
import { log } from '../lib/logger.js';

async function migrateBrokerAccounts() {
  log('info', 'Starting migration of broker_accounts to Vault...');
  const { rows: users } = await db.query<{ user_id: string }>('select distinct user_id from broker_accounts');
  
  for (const user of users) {
    const accounts = await listBrokerAccountsForUser(user.user_id);
    for (const account of accounts) {
      if (account.apiKeyVaultId && account.apiSecretVaultId) {
        log('info', `Skipping account ${account.id} (already migrated)`);
        continue;
      }

      try {
        const apiKey = decryptBrokerCredential(account.apiKeyEncrypted);
        const apiSecret = decryptBrokerCredential(account.apiSecretEncrypted);

        const apiKeyVaultId = await storeSecretInVault(
          `broker_account_api_key_${account.id}`,
          `API Key for broker account ${account.id}`,
          apiKey
        );
        const apiSecretVaultId = await storeSecretInVault(
          `broker_account_api_secret_${account.id}`,
          `API Secret for broker account ${account.id}`,
          apiSecret
        );

        await upsertBrokerAccount({
          ...account,
          apiKeyVaultId,
          apiSecretVaultId,
        });
        log('info', `Migrated broker account ${account.id} to Vault.`);
      } catch (e) {
        log('error', `Failed to migrate broker account ${account.id}`, { error: String(e) });
      }
    }
  }
}

async function migrateExchangeIntegrations() {
  log('info', 'Starting migration of exchange_integrations to Vault...');
  const { rows: users } = await db.query<{ user_id: string }>('select distinct user_id from exchange_integrations');

  for (const user of users) {
    const integrations = await listIntegrations(user.user_id);
    for (const integration of integrations) {
      if (integration.apiKeyVaultId && integration.apiSecretVaultId) {
        log('info', `Skipping integration ${integration.id} (already migrated)`);
        continue;
      }

      try {
        const apiKey = decryptBrokerCredential(integration.encryptedKey);
        const apiSecret = decryptBrokerCredential(integration.encryptedSecret);
        let apiPassphraseVaultId: string | null = null;
        if (integration.encryptedPassphrase) {
          const passphrase = decryptBrokerCredential(integration.encryptedPassphrase);
          apiPassphraseVaultId = await storeSecretInVault(
            `exchange_passphrase_${integration.userId}_${integration.exchange}`,
            `API Passphrase for ${integration.exchange} integration`,
            passphrase
          );
        }

        const apiKeyVaultId = await storeSecretInVault(
          `exchange_key_${integration.userId}_${integration.exchange}`,
          `API Key for ${integration.exchange} integration`,
          apiKey
        );
        const apiSecretVaultId = await storeSecretInVault(
          `exchange_secret_${integration.userId}_${integration.exchange}`,
          `API Secret for ${integration.exchange} integration`,
          apiSecret
        );

        await upsertIntegration({
          ...integration,
          apiKeyVaultId,
          apiSecretVaultId,
          apiPassphraseVaultId,
        });
        log('info', `Migrated exchange integration ${integration.id} to Vault.`);
      } catch (e) {
        log('error', `Failed to migrate exchange integration ${integration.id}`, { error: String(e) });
      }
    }
  }
}

async function runMigration() {
  try {
    await migrateBrokerAccounts();
    await migrateExchangeIntegrations();
    log('info', 'Migration to Vault completed successfully.');
  } catch (e) {
    log('error', 'Migration to Vault failed.', { error: String(e) });
  } finally {
    await db.end();
  }
}

runMigration();
