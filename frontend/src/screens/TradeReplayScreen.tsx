import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TradeReplayView } from '@/components/trade/TradeReplayView';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { querySnapshotsForLifecycleEventId } from '@/lib/aiSnapshotLog';
import type { AiStateSnapshot } from '@/types/aiSnapshot';
import type { SignalLifecycleEvent } from '@/types/signal';

function asSetupLabel(setupType: SignalLifecycleEvent['setupType']): string {
  if (setupType === 'breakout') return 'Breakout';
  if (setupType === 'pullback') return 'Pullback';
  return 'Reversal';
}

export default function TradeReplayScreen() {
  const { lifecycleAnalytics, aiSnapshotLog } = useSignalEngine();
  const [params, setSearchParams] = useSearchParams();
  const eventId = params.get('eventId') ?? '';

  const sorted = useMemo(
    () => [...lifecycleAnalytics.events].sort((a, b) => b.timestamp - a.timestamp),
    [lifecycleAnalytics.events],
  );

  const selected = useMemo(() => sorted.find((e) => e.id === eventId) ?? null, [sorted, eventId]);
  const regimeSnapshots: AiStateSnapshot[] = useMemo(() => {
    if (!selected) return [];
    return querySnapshotsForLifecycleEventId(aiSnapshotLog, selected.id).filter((s) => Boolean(s.regimePredictor));
  }, [aiSnapshotLog, selected]);

  return (
    <section className="pb-28 pt-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Sigflo AI</p>
          <h1 className="mt-1 text-lg font-semibold text-white">Trade replay</h1>
          <p className="mt-1 max-w-prose text-xs text-sigflo-muted">
            Read-only playback from stored lifecycle records. No signals are recomputed or rewritten.
          </p>
        </div>
        <Link
          to="/performance"
          className="shrink-0 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/90 transition-colors hover:border-cyan-500/25 hover:bg-white/[0.07]"
        >
          ← Performance
        </Link>
      </header>

      <div className="mb-3">
        <label htmlFor="replay-select" className="text-[10px] font-semibold uppercase tracking-wide text-sigflo-muted">
          Choose signal
        </label>
        <select
          id="replay-select"
          className="mt-1 w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[13px] text-white"
          value={selected?.id ?? ''}
          onChange={(e) => {
            const id = e.target.value;
            if (id) setSearchParams({ eventId: id });
            else setSearchParams({});
          }}
        >
          <option value="">Select a lifecycle event…</option>
          {sorted.map((e) => (
            <option key={e.id} value={e.id}>
              {e.symbol.replace(/USDT$/i, '')} · {e.bias.toUpperCase()} · {asSetupLabel(e.setupType)} ·{' '}
              {e.outcome ?? e.status}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-sigflo-muted">
          Tip: open this screen from Performance → Recent signal history → Replay.
        </p>
      </div>

      {selected ? (
        <TradeReplayView event={selected} snapshots={regimeSnapshots} key={selected.id} />
      ) : (
        <p className="rounded-2xl border border-white/[0.08] bg-sigflo-surface p-4 text-[13px] text-sigflo-muted">
          Select a signal to load its replay timeline.
        </p>
      )}
    </section>
  );
}
