import { useCallback, useEffect, useRef, useState } from 'react';
import { connectExchange, disconnectExchange, listIntegrations } from '@/services/api/integrationClient';
import type { ExchangeId, IntegrationStatus } from '@/types/integrations';

export function useExchangeIntegrations() {
  const [items, setItems] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const nextItems = await listIntegrations();
      if (!mountedRef.current) return;
      setItems(nextItems);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load integrations.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const connect = useCallback(async (exchange: ExchangeId, creds: { apiKey: string; apiSecret: string; passphrase?: string }) => {
    await connectExchange(exchange, creds);
    await refresh();
  }, [refresh]);

  const disconnect = useCallback(async (exchange: ExchangeId) => {
    await disconnectExchange(exchange);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh, connect, disconnect };
}
