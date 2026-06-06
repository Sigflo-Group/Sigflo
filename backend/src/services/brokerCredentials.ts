import type { BrokerAccountRow } from '../db/queries/brokerAccounts.js';
import type { ConnectInput } from '../core/exchange-interface.js';
import { decryptBrokerCredential, getSecretFromVault } from './exchangeKey.service.js';

export async function resolveBrokerCredentials(account: BrokerAccountRow): Promise<ConnectInput> {
  const apiKey = account.apiKeyVaultId
    ? await getSecretFromVault(account.apiKeyVaultId)
    : decryptBrokerCredential(account.apiKeyEncrypted);
  const apiSecret = account.apiSecretVaultId
    ? await getSecretFromVault(account.apiSecretVaultId)
    : decryptBrokerCredential(account.apiSecretEncrypted);

  if (!apiKey || !apiSecret) {
    throw new Error('Failed to load exchange credentials.');
  }

  return { apiKey, apiSecret };
}
