import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { connectExchange, disconnectExchange, listIntegrations, setActiveExchange } from '@/services/api/integrationClient';
import type { ExchangeId, IntegrationStatus } from '@/types/integrations';

export function useExchangeIntegrations() {
  const { loading: authLoading, user } = useAuth();
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
      setItems(Array.isArray(nextItems) ? nextItems : []);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load integrations.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const connect = useCallback(
    async (exchange: ExchangeId, creds: { apiKey: string; apiSecret: string; passphrase?: string }) => {
      await connectExchange(exchange, creds);
      await refresh();
    },
    [refresh],
  );

  const disconnect = useCallback(
    async (exchange: ExchangeId) => {
      await disconnectExchange(exchange);
      await refresh();
    },
    [refresh],
  );

  const setActive = useCallback(
    async (accountId: string) => {
      await setActiveExchange(accountId);
      await refresh();
    },
    [refresh],
  );

  // Wait for auth to resolve before firing — avoids a guaranteed 401 on mount
  // when the Supabase session hasn't been read from storage yet.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, userId, refresh]);

  return { items, loading, error, refresh, connect, disconnect, setActive };
}
