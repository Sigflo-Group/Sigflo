import { BybitAdapter } from '../exchanges/bybit.js';
import { resolveBrokerCredentials } from './brokerCredentials.js';
import type { BrokerAccountRow } from '../db/queries/brokerAccounts.js';
import { placeBybitManagedLinearOrder } from './bybitManagedOrder.service.js';

const bybitAdapter = new BybitAdapter();

export async function executeBrokerOrder(input: {
  account: BrokerAccountRow;
  symbol: string;
  direction: 'long' | 'short';
  positionSizeUsd: number;
  leverage: number;
  entryPrice: number;
  clientOrderId: string;
}) {
  if (input.account.broker !== 'bybit') {
    throw new Error('Broker not supported');
  }

  const creds = await resolveBrokerCredentials(input.account);

  if (!Number.isFinite(input.entryPrice) || input.entryPrice <= 0) {
    throw new Error(`Invalid entry price for order calculation: ${input.entryPrice}`);
  }
  if (!Number.isFinite(input.positionSizeUsd) || input.positionSizeUsd <= 0) {
    throw new Error(`Invalid position size for order calculation: ${input.positionSizeUsd}`);
  }
  if (!/^[A-Za-z0-9_-]{8,36}$/.test(input.clientOrderId)) {
    throw new Error('Invalid client order id');
  }

  await bybitAdapter.ensureTradeEnabled(creds);

  const side = input.direction === 'long' ? 'Buy' : 'Sell';
  const rawQty = input.positionSizeUsd / input.entryPrice;
  const result = await placeBybitManagedLinearOrder({
    creds,
    symbol: input.symbol,
    side,
    rawQty,
    orderLinkId: input.clientOrderId,
  });

  return {
    brokerOrderId: result.orderId,
    brokerResponse: {
      orderId: result.orderId,
      orderLinkId: result.orderLinkId ?? input.clientOrderId,
      reconciledAfterTimeout: result.reconciledAfterTimeout,
    },
  };
}
