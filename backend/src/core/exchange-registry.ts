import { BybitAdapter } from '../exchanges/bybit/adapter.js';
import { MexcAdapter } from '../exchanges/mexc/adapter.js';
import type { ExchangeAdapter, ExchangeId } from './exchange-interface.js';

const registry: Record<ExchangeId, ExchangeAdapter> = {
  bybit: new BybitAdapter(),
  mexc: new MexcAdapter(),
};

export function getAdapter(id: ExchangeId): ExchangeAdapter {
  const adapter = registry[id];
  if (!adapter) throw new Error(`No adapter registered for exchange: ${id}`);
  return adapter;
}

export function getSupportedExchanges(): ExchangeId[] {
  return Object.keys(registry) as ExchangeId[];
}
