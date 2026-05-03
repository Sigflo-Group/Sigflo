import { bybitClient } from './bybitClient.js';

export async function executeBybitMarketOrder(input: {
  apiKey: string;
  apiSecret: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  qty: string;
  leverage: number;
}) {
  return bybitClient.placeLinearOrder(
    { apiKey: input.apiKey, apiSecret: input.apiSecret },
    {
      symbol: input.symbol,
      side: input.side,
      orderType: 'Market',
      qty: input.qty,
      positionIdx: 0,
    },
  );
}
