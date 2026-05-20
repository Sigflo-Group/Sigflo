import { listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import { decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { getAdapter } from './exchange-registry.js';
import type { ConnectInput, ExchangeAdapter, ExchangeId } from './exchange-interface.js';

export type ActiveExchangeContext = {
  exchange: ExchangeId;
  adapter: ExchangeAdapter;
  creds: ConnectInput;
};

/**
 * Loads the single active exchange for a user.
 * Returns null when no exchange is linked or all accounts are invalid.
 */
export async function getActiveExchange(userId: string): Promise<ActiveExchangeContext | null> {
  const accounts = await listBrokerAccountsForUser(userId);
  const account = accounts.find((a) => a.status === 'connected');
  if (!account) return null;
  const exchange = account.broker as ExchangeId;

  const creds: ConnectInput = {
    apiKey: decryptBrokerCredential(account.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(account.apiSecretEncrypted),
  };

  return { exchange, adapter: getAdapter(exchange), creds };
}
