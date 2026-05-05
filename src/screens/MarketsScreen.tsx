import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeedRoute } from '@/config/appRoutes';
import { MarketCard } from '@/components/markets/MarketCard';
import { MarketNewsScanSheet } from '@/components/news/MarketNewsScanSheet';
import { useFeedMiniCharts } from '@/hooks/useFeedMiniCharts';
import { useSyncedTradeChartInterval } from '@/hooks/useSyncedTradeChartInterval';
import { useMarketsScanner } from '@/hooks/useMarketsScanner';
import { buildTradeQueryString } from '@/lib/tradeNavigation';
import type { MarketScannerRow } from '@/types/markets';

type MarketsTab = 'watchlist' | 'tracked' | 'movers';

const tabs: { id: MarketsTab; label: string }[] = [
  { id: 'tracked', label: 'Tracked' },
  { id: 'movers', label: 'Movers' },
  { id: 'watchlist', label: 'Watchlist' },
];

export default function MarketsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MarketsTab>('tracked');
  const [newsScanOpen, setNewsScanOpen] = useState(false);
  const { trackedRows, moverRows, watchlistRows, mode, connection, tickersLoading } = useMarketsScanner();
  const navigateWithTransition = (to: string) => {
    const w = window as Window & { startViewTransition?: (cb: () => void) => void };
    if (typeof w.startViewTransition === 'function') {
      w.startViewTransition(() => navigate(to));
      return;
    }
    navigate(to);
  };

  const openRow = (row: MarketScannerRow) => {
    const query = buildTradeQueryString(row.signal, { marketStatus: row.status });
    navigateWithTransition(`/trade?${query}`);
  };


  const rows = tab === 'tracked' ? trackedRows : tab === 'movers' ? moverRows : watchlistRows;
  const primaryTriggeredSymbol = useMemo(() => {
    const triggered = rows.filter((r) => r.status === 'triggered');
    if (triggered.length === 0) return null;
    const sorted = [...triggered].sort((a, b) => (b.triggeredAtMs ?? 0) - (a.triggeredAtMs ?? 0));
    return sorted[0]?.symbol ?? null;
  }, [rows]);
  const triggeredNowCount = useMemo(() => {
    const seen = new Set<string>();
    for (const row of [...trackedRows, ...moverRows, ...watchlistRows]) {
      if (row.status !== 'triggered') continue;
      seen.add(row.symbol);
    }
    return seen.size;
  }, [moverRows, trackedRows, watchlistRows]);
  const fastPairs = useMemo(() => {
    const out: string[] = [];
    for (const r of [...trackedRows, ...moverRows, ...watchlistRows]) {
      if (r.status === 'triggered') out.push(r.pair);
    }
    return out;
  }, [trackedRows, moverRows, watchlistRows]);
  const marketsChartInterval = useSyncedTradeChartInterval();
  const miniChartPairs = useMemo(() => {
    const s = new Set<string>();
    for (const r of [...trackedRows, ...moverRows, ...watchlistRows]) {
      s.add(r.pair.toUpperCase());
    }
    return [...s];
  }, [trackedRows, moverRows, watchlistRows]);
  const miniCharts = useFeedMiniCharts(miniChartPairs, {
    interval: marketsChartInterval,
    fastPairs,
    fastRefreshMs: 8_000,
  });
  const statusDot =
    connection === 'connected'
      ? 'bg-sigflo-accent'
      : connection === 'reconnecting'
        ? 'bg-amber-400 animate-pulse'
        : 'bg-slate-500';

  return (
    <div className="sigflo-markets-screen-root relative min-h-[100dvh] pb-[max(4.25rem,env(safe-area-inset-bottom))] pt-[max(0.35rem,env(safe-area-inset-top))] sm:pb-[max(4.75rem,env(safe-area-inset-bottom))] sm:pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="relative z-10 mx-auto w-full max-w-none px-0 sm:max-w-md sm:px-3">
        {/* Header */}
        <header className="mb-2 px-2 sm:mb-3 sm:px-0">
          <h1 className="text-[1.22rem] font-bold tracking-tight text-white sm:text-xl">Markets</h1>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-sigflo-muted sm:text-[11px]">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            <span>
              {mode} · {rows.length} pair{rows.length === 1 ? '' : 's'}
              {tickersLoading ? ' · loading…' : ''}
            </span>
          </div>
          <div className="mt-0.5 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] font-medium text-sigflo-muted sm:text-[10px]">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              Forming
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/95" />
              In Play
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#b2fff0] drop-shadow-[0_0_8px_rgba(0,255,200,0.35)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.75)]" />
              Triggered
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-end gap-1 sm:mt-1.5 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setNewsScanOpen(true)}
              className="inline-flex items-center rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-sigflo-text transition hover:border-cyan-400/25 hover:bg-white/[0.07] sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-[11px]"
            >
              Today&apos;s brief
            </button>
            <button
              type="button"
              onClick={() => navigate(getFeedRoute())}
              className="inline-flex items-center gap-1 rounded-md border border-sigflo-accent/26 bg-sigflo-accent/10 px-2 py-1 text-[10px] font-semibold text-sigflo-accent transition hover:border-sigflo-accent/40 hover:bg-sigflo-accent/14 sm:gap-1.5 sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-[11px]"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-sigflo-accent [animation-duration:1.8s]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sigflo-accent" />
              </span>
              <span className="sm:hidden">{triggeredNowCount} triggered</span>
              <span className="hidden sm:inline">
                {triggeredNowCount} signal{triggeredNowCount === 1 ? '' : 's'} triggered now
              </span>
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-2 mx-2 flex gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 sm:mb-3 sm:mx-0 sm:gap-1 sm:rounded-xl sm:p-0.5" role="tablist">
          {tabs.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`min-w-0 flex-1 rounded-md px-2 py-1 text-[10px] font-semibold transition sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs ${
                  active
                    ? 'bg-sigflo-accent/12 text-sigflo-accent ring-1 ring-sigflo-accent/25'
                    : 'text-sigflo-muted hover:text-sigflo-text'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Market rows */}
        <div className="space-y-1 px-1.5 sm:space-y-1.5 sm:px-0">
          {tab === 'movers' && !tickersLoading && moverRows.length === 0 ? (
            <p className="rounded-xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture px-3 py-7 text-center text-[13px] text-sigflo-muted sm:rounded-2xl sm:px-4 sm:py-8 sm:text-sm">
              No movers yet — check back later.
            </p>
          ) : null}
          {tab === 'watchlist' && watchlistRows.length === 0 ? (
            <p className="rounded-xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture px-3 py-7 text-center text-[13px] text-sigflo-muted sm:rounded-2xl sm:px-4 sm:py-8 sm:text-sm">
              No starred pairs yet. Open a chart on Trade and tap the star in the header to save markets here.
            </p>
          ) : null}
          {rows.map((row) => (
            <MarketCard
              key={`${tab}-${row.symbol}`}
              row={row}
              isPrimaryTriggered={row.symbol === primaryTriggeredSymbol}
              miniCandles={miniCharts[row.pair.toUpperCase()]}
              onOpen={() => openRow(row)}
            />
          ))}
        </div>
      </div>

      <MarketNewsScanSheet open={newsScanOpen} onClose={() => setNewsScanOpen(false)} />
    </div>
  );
}
