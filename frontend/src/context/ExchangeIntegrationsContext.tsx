import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  connectExchange,
  disconnectExchange,
  listIntegrations,
  setActiveExchange,
} from '@/services/api/integrationClient';
import type { ExchangeId, IntegrationStatus } from '@/types/integrations';

export type ExchangeIntegrationsContextValue = {
  items: IntegrationStatus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  connect: (
    exchange: ExchangeId,
    creds: { apiKey: string; apiSecret: string; passphrase?: string },
  ) => Promise<IntegrationStatus>;
  disconnect: (exchange: ExchangeId) => Promise<void>;
  setActive: (accountId: string) => Promise<IntegrationStatus>;
};

const ExchangeIntegrationsContext = createContext<ExchangeIntegrationsContextValue | null>(null);

function mergeIntegration(prev: IntegrationStatus[], next: IntegrationStatus): IntegrationStatus[] {
  const rest = prev.filter((i) => i.exchange !== next.exchange);
  return [...rest, next];
}

function applyActiveExchange(items: IntegrationStatus[], active: IntegrationStatus): IntegrationStatus[] {
  return items.map((i) => ({
    ...i,
    isActive: i.exchange === active.exchange,
  }));
}

export function ExchangeIntegrationsProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading, user } = useAuth();
  const [items, setItems] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const refreshGenRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    const gen = ++refreshGenRef.current;
    setLoading(true);
    setError(null);
    try {
      const nextItems = await listIntegrations();
      if (!mountedRef.current || gen !== refreshGenRef.current) return;
      setItems(Array.isArray(nextItems) ? nextItems : []);
    } catch (e) {
      if (!mountedRef.current || gen !== refreshGenRef.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load integrations.');
    } finally {
      if (mountedRef.current && gen === refreshGenRef.current) setLoading(false);
    }
  }, [user]);

  const connect = useCallback(
    async (exchange: ExchangeId, creds: { apiKey: string; apiSecret: string; passphrase?: string }) => {
      const linked = await connectExchange(exchange, creds);
      refreshGenRef.current += 1;
      if (mountedRef.current) {
        setItems((prev) => mergeIntegration(prev, linked));
        setError(null);
      }
      await refresh();
      return linked;
    },
    [refresh],
  );

  const disconnect = useCallback(
    async (exchange: ExchangeId) => {
      await disconnectExchange(exchange);
      refreshGenRef.current += 1;
      if (mountedRef.current) {
        setItems((prev) => prev.filter((i) => i.exchange !== exchange));
        setError(null);
      }
      await refresh();
    },
    [refresh],
  );

  const setActive = useCallback(
    async (accountId: string) => {
      const updated = await setActiveExchange(accountId);
      refreshGenRef.current += 1;
      if (mountedRef.current) {
        setItems((prev) => applyActiveExchange(prev, updated));
        setError(null);
      }
      await refresh();
      return updated;
    },
    [refresh],
  );

  const userId = user?.id ?? null;
  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, userId, refresh]);

  const value = useMemo(
    () => ({ items, loading, error, refresh, connect, disconnect, setActive }),
    [items, loading, error, refresh, connect, disconnect, setActive],
  );

  return <ExchangeIntegrationsContext.Provider value={value}>{children}</ExchangeIntegrationsContext.Provider>;
}

export function useExchangeIntegrations(): ExchangeIntegrationsContextValue {
  const ctx = useContext(ExchangeIntegrationsContext);
  if (ctx == null) {
    throw new Error('useExchangeIntegrations must be used within ExchangeIntegrationsProvider.');
  }
  return ctx;
}
