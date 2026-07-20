import { randomUUID } from 'node:crypto';
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

  await bybitAdapter.ensureTradeEnabled(creds);

  const side = input.direction === 'long' ? 'Buy' : 'Sell';
  const rawQty = input.positionSizeUsd / input.entryPrice;
  // Bybit orderLinkId allows up to 36 chars. Prefix makes Sigflo-originated orders recognizable.
  const clientOrderId = `sf-${randomUUID().replace(/-/g, '').slice(0, 32)}`;
  const result = await placeBybitManagedLinearOrder({
    creds,
    symbol: input.symbol,
    side,
    rawQty,
    orderLinkId: clientOrderId,
  });

  return {
    brokerOrderId: result.orderId,
    brokerResponse: {
      orderId: result.orderId,
      orderLinkId: result.orderLinkId ?? clientOrderId,
      reconciledAfterTimeout: result.reconciledAfterTimeout,
    },
  };
}
