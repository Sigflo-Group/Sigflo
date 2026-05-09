import { useSignalEngine } from '@/hooks/useSignalEngine';
import type { RegimePredictorOutput } from '@/types/regimePredictor';

type Props = {
  model: RegimePredictorOutput | null;
  panelId?: string;
};

function pressureLabel(key: keyof RegimePredictorOutput['transitionPressures']): string {
  switch (key) {
    case 'trendToRange':
      return 'Trend losing strength';
    case 'rangeToTrend':
      return 'Trend trying to form';
    case 'compressionToExpansion':
      return 'Breakout pressure building';
    case 'expansionToCompression':
      return 'Market calming down';
    case 'stableToVolatile':
      return 'Market becoming unstable';
    case 'volatileToStable':
      return 'Market settling down';
    default:
      return key;
  }
}

function regimeLabel(regime: RegimePredictorOutput['currentRegime']): string {
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

function toneForPressure(v: number): string {
  if (v >= 70) return 'bg-rose-400/65';
  if (v >= 50) return 'bg-amber-300/70';
  if (v >= 30) return 'bg-cyan-300/70';
  return 'bg-white/20';
}

export function EarlyRegimeWarningPanel({ model, panelId = 'early-regime-warning' }: Props) {
  const { proIntelligenceMode, isAdvancedPanelExpanded, setAdvancedPanelExpanded } = useSignalEngine();
  if (!model) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Market conditions changing</p>
          {proIntelligenceMode ? (
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
              Awaiting data
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] text-zinc-400">
          Pro mode is on. Market condition insights will appear after enough live candles are available for this pair.
        </p>
      </section>
    );
  }
  const expanded = isAdvancedPanelExpanded(panelId);
  const pressureRows = Object.entries(model.transitionPressures) as Array<
    [keyof RegimePredictorOutput['transitionPressures'], number]
  >;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Market conditions changing</p>
        {proIntelligenceMode ? (
          <button
            type="button"
            onClick={() => setAdvancedPanelExpanded(panelId, !expanded)}
            className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 transition hover:text-zinc-100"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
      {!expanded ? (
        <p className="mt-2 text-[11px] text-zinc-400">
          Change risk {Math.round(model.shiftProbability)} / 100 · trend health {Math.round(model.regimeStability)} / 100
        </p>
      ) : null}
      {expanded ? (
        <>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
          <p className="text-zinc-500">Market conditions</p>
          <p className="mt-0.5 font-semibold text-zinc-100">{regimeLabel(model.currentRegime)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
          <p className="text-zinc-500">Likely next conditions</p>
          <p className="mt-0.5 font-semibold text-zinc-100">
            {model.likelyNextRegime ? regimeLabel(model.likelyNextRegime) : 'Unclear'}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
          <p className="text-zinc-500" title="Internally calculated using regime stability metrics">Trend health</p>
          <p className="mt-0.5 font-semibold text-zinc-100">{Math.round(model.regimeStability)} / 100</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
          <p className="text-zinc-500" title="Internally calculated using transition-pressure metrics">Change risk</p>
          <p className="mt-0.5 font-semibold text-zinc-100">{Math.round(model.shiftProbability)} / 100</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Market activity</p>
        {pressureRows.map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>{pressureLabel(key)}</span>
              <span>{Math.round(value)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className={`h-1.5 rounded-full ${toneForPressure(value)}`} style={{ width: `${Math.max(2, Math.round(value))}%` }} />
            </div>
          </div>
        ))}
      </div>

      {model.earlyWarningSignals.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">What to watch</p>
          <ul className="mt-1 space-y-1 text-[11px] text-zinc-300">
            {model.earlyWarningSignals.slice(0, 4).map((s) => (
              <li key={s}>- {s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.supportingEvidence.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">What we are seeing</p>
          <ul className="mt-1 space-y-1 text-[11px] text-zinc-400">
            {model.supportingEvidence.slice(0, 4).map((s) => (
              <li key={s}>- {s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.riskFlags.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Risk flags</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {model.riskFlags.slice(0, 4).map((f) => (
              <span key={f} className="rounded-md border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-100/90">
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}
        </>
      ) : null}
    </section>
  );
}

