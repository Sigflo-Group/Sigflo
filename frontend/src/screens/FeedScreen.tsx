import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MarketNewsScanSheet } from '@/components/news/MarketNewsScanSheet';
import { SignalCard } from '@/components/feed/SignalCard';
import { OnboardingChecklist } from '@/components/feed/OnboardingChecklist';
import { useFeedMiniCharts } from '@/hooks/useFeedMiniCharts';
import { useSyncedTradeChartInterval } from '@/hooks/useSyncedTradeChartInterval';
import { tradeChartIntervalShortLabel } from '@/lib/tradeChartIntervalPreference';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { dismissFeedWelcome, isFeedWelcomeDismissed } from '@/lib/feedWelcomeBanner';
import { updateChecklist } from '@/lib/onboardingChecklist';
import {
  buildTrackedFallbackSignal,
  deriveMarketStatus,
  isFeedActionableOpportunity,
  symbolToPair,
  TRACKED_SYMBOLS,
} from '@/lib/marketScannerRows';

type FeedFilter = 'all' | 'strong' | 'actionable' | 'risky';

const filterChips: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'strong', label: 'Strong 75+' },
  { id: 'actionable', label: 'Actionable' },
  { id: 'risky', label: 'Risky' },
];

export function FeedScreen() {
  const [searchParams] = useSearchParams();
  const queryFilter = searchParams.get('filter');
  const initialFilter: FeedFilter =
    queryFilter === 'strong' || queryFilter === 'actionable' || queryFilter === 'risky' || queryFilter === 'all'
      ? queryFilter
      : 'all';
  const [filter, setFilter] = useState<FeedFilter>(initialFilter);
  const [newsScanOpen, setNewsScanOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!isFeedWelcomeDismissed());
  const onDismissWelcome = useCallback(() => {
    dismissFeedWelcome();
    setShowWelcome(false);
  }, []);
  const {
    signals: liveSignals,
    loading,
    mode,
    connection,
  } = useSignalEngine();

  /** Tracked watchlist pairs with no engine emission yet — same shells as Markets “Tracked”. */
  const feedSignalsBase = useMemo(() => {
    const covered = new Set(liveSignals.map((s) => s.pair.toUpperCase()));
    const forming = TRACKED_SYMBOLS.filter((sym) => !covered.has(symbolToPair(sym).toUpperCase())).map((sym) =>
      buildTrackedFallbackSignal(symbolToPair(sym), sym),
    );
    return [...liveSignals, ...forming].sort((a, b) => b.setupScore - a.setupScore);
  }, [liveSignals]);

  useEffect(() => {
    const next = searchParams.get('filter');
    if (next === 'strong' || next === 'actionable' || next === 'risky' || next === 'all') {
      setFilter(next);
    }
  }, [searchParams]);

  const signals = useMemo(() => {
    if (filter === 'strong') return feedSignalsBase.filter((s) => s.setupScore >= 75);
    if (filter === 'actionable') return feedSignalsBase.filter(isFeedActionableOpportunity);
    if (filter === 'risky') {
      return feedSignalsBase.filter((s) => s.riskTag === 'High Risk' || deriveMarketStatus(s) === 'overextended');
    }
    return feedSignalsBase;
  }, [filter, feedSignalsBase]);

  const statusDot = loading
    ? 'bg-amber-400 animate-pulse'
    : connection === 'connected'
      ? 'bg-sigflo-accent'
      : 'bg-slate-500';
  const feedChartInterval = useSyncedTradeChartInterval();
  const miniChartsByPair = useFeedMiniCharts(signals.map((s) => s.pair), { interval: feedChartInterval });

  return (
    <div className="pb-6 pt-4">
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Signals</h2>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-sigflo-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
              <span>
                {loading ? 'Syncing' : mode === 'OFFLINE' ? 'Offline' : mode} ·{' '}
                {filter === 'all'
                  ? `${feedSignalsBase.length} setups`
                  : `${signals.length} of ${feedSignalsBase.length} setups`}
              </span>
            </div>
            <div className="mt-1 inline-flex items-center gap-2 text-[10px] font-medium text-sigflo-muted">
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
          </div>
          {import.meta.env.DEV ? (
            <div className="flex items-center gap-2">
              <Link
                to="/engine-debug"
                className="inline-flex items-center rounded-lg border border-cyan-500/25 bg-cyan-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/85 transition hover:bg-cyan-500/[0.14] hover:text-cyan-100"
              >
                Debug
              </Link>
              <Link
                to="/scanner-lab"
                className="inline-flex items-center rounded-lg border border-violet-500/25 bg-violet-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/85 transition hover:bg-violet-500/[0.14] hover:text-violet-100"
              >
                Lab
              </Link>
            </div>
          ) : null}
        </div>

          {showWelcome ? (
          <div className="rounded-2xl border border-sigflo-accent/20 bg-sigflo-accent/[0.04] px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sigflo-accent">Welcome to Sigflo</p>
              <button type="button" onClick={onDismissWelcome} className="text-[11px] text-zinc-500 hover:text-zinc-300" aria-label="Dismiss welcome">
                Dismiss
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-sigflo-accent text-sm">✦</span>
                <p className="text-[12px] leading-relaxed text-zinc-300">
                  <span className="font-semibold text-white">Signals</span> are live market setups the scanner detects — each shows a score, direction bias, and trade plan.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-sigflo-accent text-sm">✦</span>
                <p className="text-[12px] leading-relaxed text-zinc-300">
                  <span className="font-semibold text-white">Scores</span> (0–100) rate conviction: 75+ is strong, 55–74 developing, below 55 still forming.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-sigflo-accent text-sm">✦</span>
                <p className="text-[12px] leading-relaxed text-zinc-300">
                  <span className="font-semibold text-white">Status dots:</span> gray is forming, cyan is in play, green is triggered. Tap any signal to review it on Trade.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-sigflo-accent text-sm">✦</span>
                <p className="text-[12px] leading-relaxed text-zinc-300">
                  <span className="font-semibold text-white">Paper trading</span> is available on every setup — no exchange needed.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <OnboardingChecklist />
        )}

        <button
          type="button"
          onClick={() => setNewsScanOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-sigflo-elevated px-3 py-2.5 text-left transition hover:border-cyan-400/22 hover:bg-[#1a1b22]"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/85">Market pulse</p>
            <p className="mt-0.5 text-[13px] font-semibold text-white">What matters today</p>
            <p className="mt-0.5 text-[11px] text-sigflo-muted">AI scan of live crypto & macro headlines</p>
          </div>
          <span className="shrink-0 text-lg text-cyan-300/75" aria-hidden>
            →
          </span>
        </button>

        {/* Filter chips */}
        <div className="flex gap-2" aria-label="Filter signals">
          {filterChips.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-[#0f1f1a] text-sigflo-accent ring-1 ring-sigflo-accent/30'
                    : 'border border-white/[0.06] bg-sigflo-elevated text-sigflo-muted hover:bg-[#1a1b22] hover:text-sigflo-text'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Signal cards */}
        <div className="space-y-5 sm:space-y-5">
          {!loading && signals.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-3 py-4 text-center">
              <p className="text-[13px] text-sigflo-muted">No setups meet this filter right now.</p>
              <p className="mt-2 text-[11px] text-sigflo-muted/60">
                {connection === 'connected'
                  ? `Scanner is live across ${feedSignalsBase.length} pairs — signals appear here as they develop.`
                  : `Scanner is ${mode.toLowerCase()} — reconnecting to market data feeds.`}
              </p>
              <p className="mt-1.5 text-[11px] text-sigflo-muted/60">
                Try a different filter or check back as price action builds new structure.
              </p>
            </div>
          ) : null}
          {signals.map((s) => (
            <SignalCard
              key={s.id}
              signal={s}
              miniCandles={miniChartsByPair[s.pair.toUpperCase()]}
              intervalLabel={tradeChartIntervalShortLabel(feedChartInterval)}
              onNavigate={() => updateChecklist({ viewedFirstSignal: true })}
            />
          ))}
        </div>
      </section>

      <MarketNewsScanSheet open={newsScanOpen} onClose={() => setNewsScanOpen(false)} />
    </div>
  );
}
