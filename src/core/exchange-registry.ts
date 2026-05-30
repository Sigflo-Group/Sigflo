import { BybitMarketDataAdapter } from '@/exchanges/bybit/adapter';
import { MexcMarketDataAdapter } from '@/exchanges/mexc/adapter';
import type { ExchangeId, MarketDataAdapter } from './market-data-interface';

type AdapterFactory = () => MarketDataAdapter;

const registry: Record<ExchangeId, AdapterFactory> = {
  bybit: () => new BybitMarketDataAdapter(),
  mexc: () => new MexcMarketDataAdapter(),
};

export function createAdapter(id: ExchangeId): MarketDataAdapter {
  const factory = registry[id];
  if (!factory) throw new Error(`No market data adapter registered for exchange: ${id}`);
  return factory();
}

export function getSupportedMarketExchanges(): ExchangeId[] {
  return Object.keys(registry) as ExchangeId[];
}
