import { useEffect } from 'react';
import { exchangeManager } from '@/core/exchange-manager';
import { useExchangeIntegrations } from '@/hooks/useExchangeIntegrations';

/**
 * Keeps public market-data adapters aligned with the user's active linked exchange.
 */
export function useSyncActiveExchangeMarketData(): void {
  const { items } = useExchangeIntegrations();

  useEffect(() => {
    const active = items.find((item) => item.isActive && item.status === 'connected');
    if (!active) return;
    exchangeManager.switchExchange(active.exchange);
  }, [items]);
}
