import { useEffect, useMemo, useRef, useState } from 'react';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import {
  attachScoreTrends,
  attachTriggerTimestamps,
  buildMarketScannerRows,
  buildTrackedScannerRows,
  buildWatchlistMarketRows,
  countActiveSetups,
  rankMoversUniverse,
  sortScannerRowsForTapPriority,
  TRACKED_SYMBOLS,
  type TriggerTimingRefs,
} from '@/lib/marketScannerRows';
import { readTradePairFavorites, TRADE_FAVORITES_CHANGED_EVENT, TRADE_PAIR_FAVORITES_STORAGE_KEY } from '@/lib/tradePairFavorites';
import { fetchTickers } from '@/services/bybit/client';
import type { MarketsScannerState } from '@/types/markets';
import type { SymbolTicker } from '@/types/market';

const REST_POLL_CONNECTED_MS = 5000;
const REST_POLL_IDLE_MS = 15000;

export function useMarketsScanner(): MarketsScannerState {
  const engine = useSignalEngine();
   const [tickersBySymbol, setTickersBySymbol] = useState<Record<string, SymbolTicker>>({});
  const [tickersLoading, setTickersLoading] = useState(true);
  const [tradeFavoritesRevision, setTradeFavoritesRevision] = useState(0);
  const scoreSnapshotRef = useRef<Record<string, number>>({});
  const triggerTimingRef = useRef<TriggerTimingRefs>({
    prevStatusBySymbol: {},
    triggeredAtBySymbol: {},
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TRADE_PAIR_FAVORITES_STORAGE_KEY) setTradeFavoritesRevision((v) => v + 1);
    };
    const onCustom = () => setTradeFavoritesRevision((v) => v + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener(TRADE_FAVORITES_CHANGED_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(TRADE_FAVORITES_CHANGED_EVENT, onCustom);
    };
  }, []);

  const mergedTickersBySymbol = useMemo(() => {
    const out = { ...tickersBySymbol };
    for (const [sym, t] of Object.entries(engine.liveTickersBySymbol)) {
      out[sym] = t;
    }
    return out;
  }, [tickersBySymbol, engine.liveTickersBySymbol]);

  const trackedSet = useMemo(() => new Set<string>(TRACKED_SYMBOLS), []);

  /** Movers not on Tracked — subscribe live tickers so cards update off WS, not only REST poll. */
  useEffect(() => {
    const list = Object.values(tickersBySymbol);
    if (list.length === 0) {
      engine.setScannerTickerExtras([]);
      return;
    }
    const ranked = rankMoversUniverse(list);
    const extras = ranked.map((t) => t.symbol).filter((s) => !trackedSet.has(s));
    engine.setScannerTickerExtras(extras);
  }, [tickersBySymbol, engine.setScannerTickerExtras, trackedSet]);

  useEffect(() => {
    let cancelled = false;
    let abortController: AbortController | null = null;
    const load = async () => {
      abortController?.abort();
      abortController = new AbortController();
      try {
        const list = await fetchTickers(undefined, abortController.signal);
        if (cancelled) return;
        const next: Record<string, SymbolTicker> = {};
        for (const t of list) next[t.symbol] = t;
        setTickersBySymbol(next);
      } catch {
        if (!cancelled) setTickersBySymbol({});
      } finally {
        if (!cancelled) setTickersLoading(false);
      }
    };
    void load();
    const pollMs =
      engine.connection === 'connected' || engine.connection === 'reconnecting'
        ? REST_POLL_CONNECTED_MS
        : REST_POLL_IDLE_MS;
    const id = window.setInterval(load, pollMs);
    return () => {
      cancelled = true;
      abortController?.abort();
      window.clearInterval(id);
    };
  }, [engine.connection]);

  const trackedRowsBare = useMemo(
    () => buildTrackedScannerRows(engine.signals, mergedTickersBySymbol),
    [engine.signals, mergedTickersBySymbol],
  );
  const moverRowsBare = useMemo(
    () => buildMarketScannerRows(engine.signals, mergedTickersBySymbol),
    [engine.signals, mergedTickersBySymbol],
  );

  const trackedRows = useMemo(() => {
    const timed = attachTriggerTimestamps(trackedRowsBare, triggerTimingRef.current, 'tracked');
    const sorted = sortScannerRowsForTapPriority(timed);
    return attachScoreTrends(sorted, scoreSnapshotRef.current);
  }, [trackedRowsBare]);
  const moverRows = useMemo(() => {
    const timed = attachTriggerTimestamps(moverRowsBare, triggerTimingRef.current, 'movers');
    const sorted = sortScannerRowsForTapPriority(timed);
    return attachScoreTrends(sorted, scoreSnapshotRef.current);
  }, [moverRowsBare]);

  const watchlistRows = useMemo(() => {
    const bases = readTradePairFavorites();
    return buildWatchlistMarketRows(bases, engine.signals, mergedTickersBySymbol);
  }, [engine.signals, mergedTickersBySymbol, tradeFavoritesRevision]);

  useEffect(() => {
    const next = { ...scoreSnapshotRef.current };
    for (const r of trackedRowsBare) next[r.symbol] = r.setupScore;
    for (const r of moverRowsBare) next[r.symbol] = r.setupScore;
    scoreSnapshotRef.current = next;
  }, [trackedRowsBare, moverRowsBare]);

  return useMemo(
    () => ({
      trackedRows,
      watchlistRows,
      moverRows,
      activeSetupsTracked: countActiveSetups(trackedRows, 70),
      activeSetupsMovers: countActiveSetups(moverRows, 70),
      moversCount: moverRows.length,
      mode: engine.mode,
      connection: engine.connection,
      tickersLoading,
    }),
    [engine.connection, engine.mode, trackedRows, watchlistRows, moverRows, tickersLoading],
  );
}
