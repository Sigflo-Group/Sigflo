import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StrategyAttributionPanel } from '@/components/analytics/StrategyAttributionPanel';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { buildStrategyAttributionModel } from '@/lib/strategyAttribution';

export default function StrategyAttributionScreen() {
  const { lifecycleAnalytics } = useSignalEngine();
  const model = useMemo(
    () => buildStrategyAttributionModel(lifecycleAnalytics.events),
    [lifecycleAnalytics.events],
  );

  return (
    <section className="pb-28 pt-4">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Sigflo AI analytics</p>
          <h1 className="mt-1 text-lg font-semibold text-white">Trading style performance</h1>
          <p className="mt-1 max-w-prose text-xs text-sigflo-muted">
            How each trading style has performed across market conditions in completed history. Read-only; this does not
            change scanning or scoring.
          </p>
        </div>
        <Link
          to="/performance"
          className="shrink-0 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/90 transition-colors hover:border-cyan-500/25"
        >
          ← Performance
        </Link>
      </header>

      <StrategyAttributionPanel model={model} />
    </section>
  );
}
