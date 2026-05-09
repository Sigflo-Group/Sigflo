import { useMemo, useState } from 'react';
import {
  ATTRIBUTION_MIN_CELL_SAMPLES,
  ATTRIBUTION_REGIMES,
  STRATEGY_MODES_ORDERED,
  heatmapTone,
  type AttributionRegime,
  type StrategyAttributionModel,
} from '@/lib/strategyAttribution';
import { STRATEGY_PERSONALITY_PROFILES } from '@/lib/strategyPersonality';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

type Props = {
  model: StrategyAttributionModel;
};

function conditionLabel(regime: AttributionRegime): string {
  switch (regime) {
    case 'trend':
      return 'Trending market';
    case 'range':
      return 'Choppy market';
    case 'volatile':
      return 'Fast-moving market';
    case 'compression':
      return 'Quiet market';
    default:
      return regime;
  }
}

export function StrategyAttributionPanel({ model }: Props) {
  const [selectedRegime, setSelectedRegime] = useState<AttributionRegime | 'all'>('all');
  const [view, setView] = useState<'summary' | 'heatmap' | 'table'>('summary');

  const comparisonRows = useMemo(() => {
    if (selectedRegime === 'all') {
      return STRATEGY_MODES_ORDERED.map((mode) => {
        const cells = ATTRIBUTION_REGIMES.map((r) => model.matrix[mode][r]).filter(Boolean);
        if (cells.length === 0) return { mode, winRate: null as number | null, n: 0, avgConf: 0, eff: 0 };
        const n = cells.reduce((s, c) => s + c!.sampleSize, 0);
        const winRate = cells.reduce((s, c) => s + c!.winRate * c!.sampleSize, 0) / Math.max(1, n);
        const avgConf = cells.reduce((s, c) => s + c!.averageConfidence * c!.sampleSize, 0) / Math.max(1, n);
        const eff = cells.reduce((s, c) => s + c!.signalEfficiency * c!.sampleSize, 0) / Math.max(1, n);
        return { mode, winRate, n, avgConf, eff };
      });
    }
    return STRATEGY_MODES_ORDERED.map((mode) => {
      const c = model.matrix[mode][selectedRegime];
      return {
        mode,
        winRate: c ? c.winRate : null,
        n: c?.sampleSize ?? 0,
        avgConf: c?.averageConfidence ?? 0,
        eff: c?.signalEfficiency ?? 0,
      };
    });
  }, [model.matrix, selectedRegime]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.07] px-3 py-2.5">
        <p className="text-[11px] font-semibold text-amber-100/95">Observational only</p>
        <p className="mt-1 text-[10px] leading-snug text-amber-50/85">
          This dashboard never changes live signals. It summarizes completed outcomes by trading style and market
          conditions at the time of signal creation. Older rows without style tags are excluded ({model.legacyUntaggedCount}{' '}
          legacy samples).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['summary', 'heatmap', 'table'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
              view === v
                ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                : 'border-white/[0.08] bg-white/[0.03] text-sigflo-muted hover:border-white/15'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sigflo-muted">Market condition focus</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRegime('all')}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
              selectedRegime === 'all'
                ? 'border-cyan-400/35 bg-cyan-500/12 text-cyan-100'
                : 'border-white/[0.08] text-sigflo-muted'
            }`}
          >
            All conditions
          </button>
          {ATTRIBUTION_REGIMES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRegime(r)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium capitalize ${
                selectedRegime === r
                  ? 'border-cyan-400/35 bg-cyan-500/12 text-cyan-100'
                  : 'border-white/[0.08] text-sigflo-muted'
              }`}
            >
              {conditionLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {model.insufficientData ? (
        <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-sigflo-muted">
          Only {model.taggedSampleCount} tagged completed outcomes so far. Aim for 15+ across styles and market
          conditions for steadier comparisons. Each cell needs at least {ATTRIBUTION_MIN_CELL_SAMPLES} samples.
        </p>
      ) : null}

      {view === 'summary' ? (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {model.rankingsByRegime.map((row) => (
              <article
                key={row.regime}
                className="rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-sigflo-muted capitalize">
                  {conditionLabel(row.regime)}
                </p>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <p>
                    <span className="text-sigflo-muted">Best: </span>
                    <span className="font-semibold text-emerald-200/90">
                      {row.best ? STRATEGY_PERSONALITY_PROFILES[row.best].label : '—'}
                    </span>
                    {row.best ? (
                      <span className="text-sigflo-muted"> ({pct(row.bestWinRate)})</span>
                    ) : null}
                  </p>
                  <p>
                    <span className="text-sigflo-muted">Runner-up: </span>
                    <span className="text-white/90">
                      {row.second ? STRATEGY_PERSONALITY_PROFILES[row.second].label : '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-sigflo-muted">Weakest: </span>
                    <span className="font-semibold text-rose-200/85">
                      {row.worst ? STRATEGY_PERSONALITY_PROFILES[row.worst].label : '—'}
                    </span>
                    {row.worst ? (
                      <span className="text-sigflo-muted"> ({pct(row.worstWinRate)})</span>
                    ) : null}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <section className="rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-sigflo-muted">
              Condition sensitivity (drawdown lens)
            </h3>
            <p className="mt-1 text-[10px] text-sigflo-muted">
              Spread = best win rate minus worst win rate across market conditions with enough samples. Higher means the
              style is more condition-sensitive.
            </p>
            <ul className="mt-2 space-y-1.5">
              {model.modeDrawdown.map((d) => (
                <li
                  key={d.mode}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-1.5 text-[11px]"
                >
                  <span className="font-medium text-white/90">{d.label}</span>
                  <span className="tabular-nums text-sigflo-muted">
                    spread {(d.regimeSpread * 100).toFixed(0)} pts · avg {pct(d.avgWinRate)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.06] p-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/90">Auto insights</h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-[11px] leading-relaxed text-cyan-50/90">
              {model.insights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {view === 'heatmap' ? (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-sigflo-surface p-2">
          <table className="w-full min-w-[520px] border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="p-1.5 text-left font-semibold text-sigflo-muted">Strategy</th>
                {ATTRIBUTION_REGIMES.map((r) => (
                  <th
                    key={r}
                    className={`p-1.5 text-center font-semibold capitalize ${
                      selectedRegime !== 'all' && selectedRegime === r ? 'text-cyan-200' : 'text-sigflo-muted'
                    }`}
                  >
                    {conditionLabel(r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STRATEGY_MODES_ORDERED.map((mode) => (
                <tr key={mode}>
                  <td className="max-w-[7rem] p-1.5 font-medium text-white/85">
                    {STRATEGY_PERSONALITY_PROFILES[mode].label}
                  </td>
                  {ATTRIBUTION_REGIMES.map((r) => {
                    const cell = model.matrix[mode][r];
                    const wr = cell?.winRate ?? null;
                    return (
                      <td
                        key={r}
                        className={`p-1 text-center tabular-nums ${
                          selectedRegime !== 'all' && selectedRegime === r ? 'ring-1 ring-cyan-400/40' : ''
                        }`}
                        style={{ backgroundColor: heatmapTone(wr) }}
                        title={
                          cell
                            ? `n=${cell.sampleSize} · WR ${pct(wr!)} · eff ${pct(cell.signalEfficiency)}`
                            : 'Not enough samples'
                        }
                      >
                        {cell ? pct(wr!) : '—'}
                        <span className="block text-[9px] text-white/45">n={cell?.sampleSize ?? 0}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {view === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-sigflo-surface p-2">
          <table className="w-full min-w-[400px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-sigflo-muted">
                <th className="p-2 text-left">Style</th>
                <th className="p-2 text-right">Win rate</th>
                <th className="p-2 text-right">n</th>
                <th className="p-2 text-right">Avg conf</th>
                <th className="p-2 text-right">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows
                .slice()
                .sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1))
                .map((row) => (
                  <tr key={row.mode} className="border-b border-white/[0.04]">
                    <td className="p-2 font-medium text-white/90">{STRATEGY_PERSONALITY_PROFILES[row.mode].label}</td>
                    <td className="p-2 text-right tabular-nums text-cyan-200/90">
                      {row.winRate != null ? pct(row.winRate) : '—'}
                    </td>
                    <td className="p-2 text-right tabular-nums text-sigflo-muted">{row.n}</td>
                    <td className="p-2 text-right tabular-nums">{row.avgConf.toFixed(1)}</td>
                    <td className="p-2 text-right tabular-nums">{pct(row.eff)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="mt-2 px-1 text-[10px] text-sigflo-muted">
            Efficiency = share of signals that won or reached at least 0.45 ATR favorable movement. Full-table
            consistency/stability still uses MFE and quality-score dispersion internally.
          </p>
        </div>
      ) : null}

      <p className="text-[10px] text-sigflo-muted">
        Tagged samples: {model.taggedSampleCount}. Market conditions come from stored signal market state at lifecycle
        creation.
      </p>
    </div>
  );
}
