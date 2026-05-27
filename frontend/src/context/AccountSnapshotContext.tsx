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
  nextBiasFlipNotifySyncGeneration,
  setBiasFlipNotifyTradeFocusLinearSymbol,
  syncBiasFlipNotifyOpenSymbolsFromSnapshots,
} from '@/lib/biasFlipNotifyGate';
import { getAccountSnapshots, getClosedTrades } from '@/services/api/portfolioClient';
import type { ClosedTradeRow, ExchangeSnapshot } from '@/types/integrations';

export type RefreshAccountSnapshotsOptions = {
  /** When true, skip loading spinner (for background poll / tab focus). */
  silent?: boolean;
};

export type AccountSnapshotContextValue = {
  items: ExchangeSnapshot[];
  closedTrades: ClosedTradeRow[];
  loading: boolean;
  error: string | null;
  refresh: (opts?: RefreshAccountSnapshotsOptions) => Promise<ExchangeSnapshot[]>;
};

const AccountSnapshotContext = createContext<AccountSnapshotContextValue | null>(null);

/**
 * One `/api/portfolio/*` subscription for the whole authenticated app shell (Feed, Trade,
 * Portfolio, etc.). Mount once above `Outlet` — do not duplicate with extra hooks.
 */
export function AccountSnapshotProvider({
  children,
  pollMs = 12_000,
}: {
  children: ReactNode;
  /** Background refresh while the tab is visible. */
  pollMs?: number;
}) {
  const { loading: authLoading, session } = useAuth();
  const [items, setItems] = useState<ExchangeSnapshot[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async (opts?: RefreshAccountSnapshotsOptions): Promise<ExchangeSnapshot[]> => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    const biasNotifyGen = nextBiasFlipNotifySyncGeneration();
    let snapshots: ExchangeSnapshot[] = [];
    try {
      const [snapRes, closedRes] = await Promise.allSettled([getAccountSnapshots(), getClosedTrades()]);
      if (!mountedRef.current) return snapshots;

      const errs: string[] = [];

      if (snapRes.status === 'fulfilled') {
        const safeItems = Array.isArray(snapRes.value) ? snapRes.value : [];
        setItems(safeItems);
        snapshots = safeItems;
        syncBiasFlipNotifyOpenSymbolsFromSnapshots(safeItems, biasNotifyGen);
      } else {
        setItems([]);
        syncBiasFlipNotifyOpenSymbolsFromSnapshots([], biasNotifyGen);
        errs.push(snapRes.reason instanceof Error ? snapRes.reason.message : 'Failed to load account snapshot.');
      }

      if (closedRes.status === 'fulfilled') setClosedTrades(closedRes.value);
      else {
        setClosedTrades([]);
        errs.push(closedRes.reason instanceof Error ? closedRes.reason.message : 'Failed to load closed trades.');
      }

      setError(errs.length > 0 ? errs.join(' · ') : null);
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
    return snapshots;
  }, []);

  const sessionUid = session?.user?.id ?? null;
  useEffect(() => {
    if (authLoading) return;
    if (sessionUid == null) setBiasFlipNotifyTradeFocusLinearSymbol(null);
    hasFetchedRef.current = true;
    void refresh();
  }, [authLoading, sessionUid, refresh]);

  useEffect(() => {
    if (pollMs <= 0 || !hasFetchedRef.current) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void refresh({ silent: true });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && hasFetchedRef.current) void refresh({ silent: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refresh]);

  const value = useMemo(
    () => ({ items, closedTrades, loading, error, refresh }),
    [items, closedTrades, loading, error, refresh],
  );

  return <AccountSnapshotContext.Provider value={value}>{children}</AccountSnapshotContext.Provider>;
}

/**
 * Shared portfolio snapshots from {@link AccountSnapshotProvider}. The optional `pollMs`
 * argument is ignored — polling is configured on the provider (default 12s).
 */
export function useAccountSnapshot(_options?: { pollMs?: number }): AccountSnapshotContextValue {
  const ctx = useContext(AccountSnapshotContext);
  if (ctx == null) {
    throw new Error('useAccountSnapshot must be used within AccountSnapshotProvider.');
  }
  return ctx;
}
