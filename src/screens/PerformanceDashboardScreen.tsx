import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import type { SignalLifecycleEvent } from '@/types/signal';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function asSetupLabel(setupType: SignalLifecycleEvent['setupType']): string {
  if (setupType === 'breakout') return 'Breakout setups';
  if (setupType === 'pullback') return 'Pullback entries';
  return 'Reversal setups';
}

function summarizeEventReason(event: SignalLifecycleEvent): string {
  const latest = event.notes.at(-1);
  if (latest) return latest;
  if (event.outcome === 'win') return 'Continuation reached target behavior.';
  if (event.outcome === 'loss') return 'Invalidation or strong reversal occurred first.';
  if (event.outcome === 'neutral') return 'Market remained sideways without clean resolution.';
  return 'Monitoring lifecycle progression.';
}

function toneClass(outcome: SignalLifecycleEvent['outcome']): string {
  if (outcome === 'win') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (outcome === 'loss') return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
  if (outcome === 'neutral') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  return 'text-sigflo-muted border-white/[0.08] bg-white/[0.03]';
}

function marketConditionLabel(
  regime: NonNullable<SignalLifecycleEvent['entryContext']['marketRegime']>,
): string {
  if (regime === 'trend') return 'Trending market';
  if (regime === 'range') return 'Choppy market';
  if (regime === 'volatile') return 'Fast-moving market';
  return 'Quiet market';
}

export default function PerformanceDashboardScreen() {
  const { lifecycleAnalytics, proIntelligenceMode } = useSignalEngine();

  const completed = useMemo(
    () => lifecycleAnalytics.events.filter((e) => e.status === 'completed' || e.status === 'archived'),
    [lifecycleAnalytics.events],
  );

  const overall = useMemo(() => {
    const wins = completed.filter((e) => e.outcome === 'win');
    const losses = completed.filter((e) => e.outcome === 'loss');
    const neutrals = completed.filter((e) => e.outcome === 'neutral');
    const total = completed.length;
    return {
      total,
      winRate: total > 0 ? wins.length / total : 0,
      lossRate: total > 0 ? losses.length / total : 0,
      neutralRate: total > 0 ? neutrals.length / total : 0,
      avgWinConfidence: mean(wins.map((w) => w.confidence)),
      avgLossConfidence: mean(losses.map((l) => l.confidence)),
    };
  }, [completed]);

  const bySetup = useMemo(() => {
    const groups = new Map<string, SignalLifecycleEvent[]>();
    for (const event of completed) {
      const key = asSetupLabel(event.setupType);
      const arr = groups.get(key) ?? [];
      arr.push(event);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).map(([label, events]) => {
      const wins = events.filter((e) => e.outcome === 'win').length;
      return {
        label,
        samples: events.length,
        winRate: events.length > 0 ? wins / events.length : 0,
        avgConfidence: mean(events.map((e) => e.confidence)),
      };
    });
  }, [completed]);

  const byTimeframe = useMemo(() => {
    const timeframes: Array<SignalLifecycleEvent['timeframe']> = ['15m'];
    return timeframes.map((tf) => {
      const events = completed.filter((e) => e.timeframe === tf);
      const wins = events.filter((e) => e.outcome === 'win').length;
      return {
        timeframe: tf,
        samples: events.length,
        winRate: events.length > 0 ? wins / events.length : 0,
      };
    });
  }, [completed]);

  const regimeStats = useMemo(() => {
    const regimes: Array<NonNullable<SignalLifecycleEvent['entryContext']['marketRegime']>> = [
      'trend',
      'range',
      'volatile',
      'compression',
    ];
    return regimes.map((regime) => {
      const events = completed.filter((e) => e.entryContext.marketRegime === regime);
      const wins = events.filter((e) => e.outcome === 'win').length;
      return {
        regime,
        samples: events.length,
        winRate: events.length > 0 ? wins / events.length : 0,
      };
    });
  }, [completed]);

  const conditionClusters = useMemo(() => {
    const strong = new Map<string, number>();
    const weak = new Map<string, number>();
    for (const event of completed) {
      const notes = event.notes;
      for (const note of notes) {
        const key = note.trim();
        if (!key) continue;
        if (event.outcome === 'win') strong.set(key, (strong.get(key) ?? 0) + 1);
        if (event.outcome === 'loss') weak.set(key, (weak.get(key) ?? 0) + 1);
      }
    }
    const toRank = (m: Map<string, number>) =>
      Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([text, count]) => ({ text, count }));
    return { strong: toRank(strong), weak: toRank(weak) };
  }, [completed]);

  const recent = useMemo(
    () =>
      [...lifecycleAnalytics.events]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20),
    [lifecycleAnalytics.events],
  );

  const insightLines = useMemo(
    () => lifecycleAnalytics.generatedInsights.slice(-5).map((x) => x.insight),
    [lifecycleAnalytics.generatedInsights],
  );

  const bestRegime = regimeStats.filter((r) => r.samples > 0).sort((a, b) => b.winRate - a.winRate)[0];
  const worstRegime = regimeStats.filter((r) => r.samples > 0).sort((a, b) => a.winRate - b.winRate)[0];
  const consistencyScore =
    byTimeframe.length > 0
      ? Math.round(100 - (Math.max(...byTimeframe.map((t) => t.winRate)) - Math.min(...byTimeframe.map((t) => t.winRate))) * 100)
      : 0;

  return (
    <section className="pb-28 pt-4">
      <header className="mb-3 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Sigflo performance dashboard</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Read-only signal analytics</h2>
        <p className="mt-1 text-xs text-sigflo-muted">
          Observational layer only. Historical lifecycle outcomes are displayed without changing signal generation.
        </p>
        {proIntelligenceMode ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/replay"
              className="inline-flex rounded-xl border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-cyan-100 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/[0.12]"
            >
              Open trade replay →
            </Link>
            <Link
              to="/analytics/strategy-attribution"
              className="inline-flex rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-amber-100 transition-colors hover:border-amber-400/40 hover:bg-amber-500/[0.12]"
            >
              Style performance →
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-sigflo-muted">
            Pro Intelligence Mode is off. Advanced replay and attribution tools are hidden to keep this view lightweight.
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total signals" value={`${overall.total}`} />
        <StatCard label="Win rate" value={pct(overall.winRate)} tone="good" />
        <StatCard label="Loss rate" value={pct(overall.lossRate)} tone="bad" />
        <StatCard label="Neutral rate" value={pct(overall.neutralRate)} tone="warn" />
        <StatCard label="Avg win confidence" value={overall.avgWinConfidence.toFixed(1)} />
        <StatCard label="Avg loss confidence" value={overall.avgLossConfidence.toFixed(1)} />
      </div>

      <Section title="Win Rate By Setup Type">
        {bySetup.length === 0 ? <EmptyRow /> : bySetup.map((row) => <BarRow key={row.label} label={row.label} pctValue={row.winRate} suffix={`${row.samples} samples · conf ${row.avgConfidence.toFixed(1)}`} />)}
      </Section>

      <Section title="Win Rate By Timeframe">
        {byTimeframe.map((row) => (
          <BarRow key={row.timeframe} label={row.timeframe} pctValue={row.winRate} suffix={`${row.samples} samples`} />
        ))}
        <p className="mt-2 text-[11px] text-sigflo-muted">
          Best timeframe: {byTimeframe.sort((a, b) => b.winRate - a.winRate)[0]?.timeframe ?? '—'} · Weakest timeframe:{' '}
          {byTimeframe.sort((a, b) => a.winRate - b.winRate)[0]?.timeframe ?? '—'} · Consistency score {consistencyScore}
        </p>
      </Section>

      {proIntelligenceMode ? (
        <>
          <Section title="Strongest Signal Conditions">
            {conditionClusters.strong.length === 0 ? <EmptyRow /> : conditionClusters.strong.map((c) => <RankRow key={`s-${c.text}`} text={c.text} count={c.count} tone="good" />)}
          </Section>

          <Section title="Weakest Signal Conditions">
            {conditionClusters.weak.length === 0 ? <EmptyRow /> : conditionClusters.weak.map((c) => <RankRow key={`w-${c.text}`} text={c.text} count={c.count} tone="bad" />)}
          </Section>
        </>
      ) : null}

      <Section title="Market Conditions Performance">
        {regimeStats.map((row) => (
          <BarRow
            key={row.regime}
            label={marketConditionLabel(row.regime)}
            pctValue={row.winRate}
            suffix={`${row.samples} samples`}
          />
        ))}
        <p className="mt-2 text-[11px] text-sigflo-muted">
          Best conditions: {bestRegime ? marketConditionLabel(bestRegime.regime) : '—'} · Weakest conditions:{' '}
          {worstRegime ? marketConditionLabel(worstRegime.regime) : '—'}
        </p>
      </Section>

      {proIntelligenceMode ? (
        <>
          <Section title="Insight Generation">
            {insightLines.length === 0 ? (
              <EmptyRow />
            ) : (
              insightLines.map((line) => (
                <p key={line} className="rounded-lg border border-cyan-400/20 bg-cyan-500/[0.07] px-2 py-1.5 text-[11px] text-cyan-100/90">
                  {line}
                </p>
              ))
            )}
          </Section>

          <Section title="Recent Signal History">
            <div className="space-y-2">
              {recent.length === 0 ? (
                <EmptyRow />
              ) : (
                recent.map((event) => (
                  <article key={event.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-white">
                        {event.symbol.replace(/USDT$/i, '')} · {event.bias.toUpperCase()} · {asSetupLabel(event.setupType)}
                      </p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneClass(event.outcome)}`}>
                        {event.outcome ?? event.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-sigflo-muted">
                      Confidence {event.confidence.toFixed(0)} · MFE {event.maxFavorableExcursion.toFixed(2)} ATR · MAE {event.maxAdverseExcursion.toFixed(2)} ATR
                    </p>
                    <p className="mt-1 text-[11px] text-white/85">{summarizeEventReason(event)}</p>
                    <Link
                      to={`/replay?eventId=${encodeURIComponent(event.id)}`}
                      className="mt-2 inline-flex text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      Replay timeline
                    </Link>
                  </article>
                ))
              )}
            </div>
          </Section>
        </>
      ) : null}
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-3 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">{title}</h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'bad' | 'warn';
}) {
  const toneClassName =
    tone === 'good'
      ? 'text-emerald-200 border-emerald-500/20 bg-emerald-500/[0.08]'
      : tone === 'bad'
        ? 'text-rose-200 border-rose-500/20 bg-rose-500/[0.08]'
        : tone === 'warn'
          ? 'text-amber-200 border-amber-500/20 bg-amber-500/[0.08]'
          : 'text-white border-white/[0.08] bg-white/[0.03]';
  return (
    <article className={`rounded-xl border px-2.5 py-2 ${toneClassName}`}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </article>
  );
}

function BarRow({ label, pctValue, suffix }: { label: string; pctValue: number; suffix: string }) {
  const value = Math.max(0, Math.min(100, pctValue * 100));
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-white/90">{label}</span>
        <span className="font-semibold text-cyan-200">{pct(pctValue)}</span>
      </div>
      <progress className="sigflo-mini-progress mt-1 h-1.5 w-full overflow-hidden rounded-full" value={value} max={100} />
      <p className="mt-1 text-[10px] text-sigflo-muted">{suffix}</p>
    </div>
  );
}

function RankRow({ text, count, tone }: { text: string; count: number; tone: 'good' | 'bad' }) {
  return (
    <p className={`flex items-start justify-between gap-2 rounded-lg border px-2 py-1.5 text-[11px] ${tone === 'good' ? 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-100' : 'border-rose-500/20 bg-rose-500/[0.07] text-rose-100'}`}>
      <span className="min-w-0">{text}</span>
      <span className="shrink-0 font-semibold">{count}</span>
    </p>
  );
}

function EmptyRow() {
  return <p className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-[11px] text-sigflo-muted">Not enough completed signal outcomes yet.</p>;
}

