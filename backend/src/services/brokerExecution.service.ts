import { BybitAdapter } from '../exchanges/bybit.js';
import { decryptBrokerCredential } from './exchangeKey.service.js';
import type { BrokerAccountRow } from '../db/queries/brokerAccounts.js';

const bybitAdapter = new BybitAdapter();

export async function executeBrokerOrder(input: {
  account: BrokerAccountRow;
  symbol: string;
  direction: 'long' | 'short';
  positionSizeUsd: number;
  leverage: number;
  entryPrice: number;
}) {
  if (input.account.broker !== 'bybit') {
    throw new Error('Broker not supported');
  }
  const creds = {
    apiKey: decryptBrokerCredential(input.account.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(input.account.apiSecretEncrypted),
  };
  await bybitAdapter.ensureTradeEnabled(creds);
  const side = input.direction === 'long' ? 'Buy' : 'Sell';
  // qty must be in base-coin units (e.g. BTC for BTCUSDT), not USD
  const qty = (input.positionSizeUsd / input.entryPrice).toString();
  const result = await bybitAdapter.placeLinearOrder(creds, {
    symbol: input.symbol,
    side,
    orderType: 'Market',
    qty,
    positionIdx: 0,
  });
  return {
    brokerOrderId: result.orderId,
    brokerResponse: { orderId: result.orderId, orderLinkId: result.orderLinkId ?? null },
  };
}
