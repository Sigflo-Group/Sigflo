import { getActiveBrokerAccount } from '../db/queries/brokerAccounts.js';
import { resolveBrokerCredentials } from '../services/brokerCredentials.js';
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
  const account = await getActiveBrokerAccount(userId);
  if (!account) return null;
  const exchange = account.broker as ExchangeId;

  const creds = await resolveBrokerCredentials(account);

  return { exchange, adapter: getAdapter(exchange), creds };
}
