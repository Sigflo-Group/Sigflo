import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import {
  CHANGE_RISK_LABEL,
  marketConditionLabel,
  MARKET_CONDITIONS_CHANGING_TITLE,
  MARKET_CONDITIONS_LABEL,
  momentumStateLabel,
  OVERALL_CHANGE_PRESSURE_LABEL,
  TREND_HEALTH_LABEL,
  transitionPressureLabel,
} from '@/lib/marketConditionsCopy';
import { buildTradeReplay, type TradeReplayMarker } from '@/lib/tradeReplay';
import type { RegimeKind } from '@/types/regimePredictor';
import type { AiStateSnapshot } from '@/types/aiSnapshot';
import type { SignalLifecycleEvent } from '@/types/signal';

type Props = {
  event: SignalLifecycleEvent;
  snapshots?: AiStateSnapshot[];
};

function formatTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ts);
  } catch {
    return new Date(ts).toISOString();
  }
}

function markerColor(kind: TradeReplayMarker['kind']): string {
  switch (kind) {
    case 'signal_created':
      return '#22d3ee';
    case 'outcome':
      return '#34d399';
    case 'invalidation':
    case 'rejection':
      return '#fb7185';
    case 'structure_peak':
    case 'confirmation':
    case 'breakout_attempt':
      return '#a78bfa';
    case 'structure_stress':
    case 'support_test':
      return '#fbbf24';
    case 'regime_shift':
      return '#38bdf8';
    default:
      return '#94a3b8';
  }
}

export function TradeReplayView({ event, snapshots = [] }: Props) {
  const { advancedLayout, isAdvancedPanelExpanded, setAdvancedPanelExpanded } = useSignalEngine();
  const model = useMemo(() => buildTradeReplay(event, Date.now()), [event]);
  const { frames, markers, story, title, disclaimer } = model;
  const pressureTimeline = useMemo(() => {
    return snapshots
      .map((s) => {
        const rp = s.regimePredictor;
        if (!rp) return null;
        return {
          ts: s.timestamp,
          shiftProbability: rp.shiftProbability,
          regimeStability: rp.regimeStability,
          likelyNextRegime: rp.likelyNextRegime,
          pressures: rp.transitionPressures,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => a.ts - b.ts);
  }, [snapshots]);
  const compositePressureSeries = useMemo(() => {
    return pressureTimeline.map((p) => {
      const vals = Object.values(p.pressures);
      const sorted = [...vals].sort((a, b) => b - a);
      const top = sorted[0] ?? 0;
      const second = sorted[1] ?? 0;
      return top * 0.72 + second * 0.28;
    });
  }, [pressureTimeline]);
  const compositeLatest = compositePressureSeries.at(-1) ?? 0;
  const compositeTone =
    compositeLatest >= 70
      ? {
          stroke: 'rgba(251,113,133,0.95)',
          text: 'text-rose-100/95',
          badge: 'bg-rose-500/15 border-rose-400/30',
          zone: 'high',
        }
      : compositeLatest >= 45
        ? {
            stroke: 'rgba(250,204,21,0.95)',
            text: 'text-amber-100/95',
            badge: 'bg-amber-500/15 border-amber-300/30',
            zone: 'medium',
          }
        : {
            stroke: 'rgba(34,211,238,0.95)',
            text: 'text-cyan-100/95',
            badge: 'bg-cyan-500/15 border-cyan-400/30',
            zone: 'low',
          };

  const [playhead, setPlayhead] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [lockedIdx, setLockedIdx] = useState<number | null>(null);

  useEffect(() => {
    setPlayhead(0);
    setHoverIdx(null);
    setLockedIdx(null);
  }, [event.id]);

  const displayIdx = lockedIdx !== null ? lockedIdx : hoverIdx !== null ? hoverIdx : playhead;
  const frame = frames[displayIdx] ?? frames[0];

  const chart = useMemo(() => {
    const prices = frames.map((f) => f.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const pad = Math.max(1e-8, (maxP - minP) * 0.08);
    const lo = minP - pad;
    const hi = maxP + pad;
    const w = 320;
    const h = 120;
    const n = Math.max(1, frames.length - 1);
    const xAt = (i: number) => (i / n) * w;
    const yPrice = (p: number) => h - ((p - lo) / (hi - lo)) * (h - 16) - 8;
    const yPress = (v: number) => h - (v / 100) * (h - 20) - 10;

    const pricePath = frames.map((f, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yPrice(f.price).toFixed(1)}`).join(' ');
    const pressPath = frames.map((f, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yPress(f.structurePressure).toFixed(1)}`).join(' ');
    const emitConfY = yPress(Math.max(0, Math.min(100, event.confidence)));

    return { w, h, xAt, yPrice, yPress, pricePath, pressPath, lo, hi, emitConfY };
  }, [frames, event.confidence]);

  const onScrub = useCallback(
    (clientX: number, width: number) => {
      const ratio = clamp01(clientX / width);
      const idx = Math.round(ratio * (frames.length - 1));
      setPlayhead(idx);
      setLockedIdx(null);
    },
    [frames.length],
  );

  const onChartPointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = clamp01((e.clientX - rect.left) / rect.width);
      const idx = Math.round(ratio * (frames.length - 1));
      if (e.type === 'pointermove') setHoverIdx(idx);
      if (e.type === 'pointerleave') setHoverIdx(null);
      if (e.type === 'pointerdown') {
        setPlayhead(idx);
        setLockedIdx(idx);
        setHoverIdx(idx);
      }
    },
    [frames.length],
  );

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Trade replay</p>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-[10px] text-sigflo-muted">{disclaimer}</p>
      </header>

      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-2">
        <svg
          viewBox={`0 0 ${chart.w} ${chart.h}`}
          className="h-32 w-full touch-none"
          preserveAspectRatio="none"
          onPointerMove={onChartPointer}
          onPointerDown={onChartPointer}
          onPointerLeave={onChartPointer}
        >
          <defs>
            <linearGradient id="replayPressGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.35" />
              <stop offset="50%" stopColor="rgb(250, 204, 21)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <path d={chart.pressPath} fill="none" stroke="url(#replayPressGrad)" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity={0.9} />
          <line
            x1={0}
            x2={chart.w}
            y1={chart.emitConfY}
            y2={chart.emitConfY}
            stroke="rgba(248,250,252,0.35)"
            strokeWidth={1}
            strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke"
          />
          <path d={chart.pricePath} fill="none" stroke="rgba(148,163,184,0.9)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {markers.map((m) => {
            const x = chart.xAt(m.frameIndex);
            return (
              <circle
                key={m.id}
                cx={x}
                cy={chart.yPrice(frames[m.frameIndex]!.price)}
                r={5}
                fill={markerColor(m.kind)}
                stroke="rgba(15,23,42,0.9)"
                strokeWidth={1}
                pointerEvents="none"
              />
            );
          })}
          {frames[displayIdx] ? (
            <line
              x1={chart.xAt(displayIdx)}
              x2={chart.xAt(displayIdx)}
              y1={4}
              y2={chart.h - 4}
              stroke="rgba(34,211,238,0.5)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        <div
          className="relative mt-2 h-8 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onScrub(e.clientX - rect.left, rect.width);
          }}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            onScrub(e.clientX - rect.left, rect.width);
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={frames.length - 1}
          aria-valuenow={playhead}
          aria-label="Replay timeline"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.08]" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cyan-400/50 transition-[width] duration-150"
            style={{ left: 0, width: `${(playhead / Math.max(1, frames.length - 1)) * 100}%` }}
          />
          <div
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-sigflo-bg shadow transition-[left] duration-150"
            style={{ left: `${(playhead / Math.max(1, frames.length - 1)) * 100}%` }}
          />
        </div>

        <p className="mt-1 px-0.5 text-[10px] text-sigflo-muted">
          Hover or click the chart to scrub · drag the slider · tap markers below to jump.
        </p>
        {hoverIdx !== null && frames[hoverIdx] ? (
          <p className="mt-1 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.07] px-2 py-1.5 text-[11px] text-cyan-50/95">
            <span className="font-semibold text-cyan-200/90">{formatTime(frames[hoverIdx]!.timestamp)}</span>
            <span className="mt-0.5 block text-cyan-50/90">{frames[hoverIdx]!.commentary}</span>
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
          <p className="text-[10px] uppercase tracking-wide text-sigflo-muted">At this frame</p>
          <p className="mt-1 font-medium text-white">{formatTime(frame.timestamp)}</p>
          <p className="mt-0.5 text-sigflo-muted">Price {frame.price.toPrecision(6)}</p>
          <p className="text-sigflo-muted">State {String(frame.signalState)}</p>
          <p className="text-sigflo-muted">Bias {frame.bias}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
          <p className="text-[10px] uppercase tracking-wide text-sigflo-muted">Conviction</p>
          <p className="mt-1 text-white">Emit confidence {frame.confidence.toFixed(0)}</p>
          <p className="mt-0.5 text-sigflo-muted">Structure line {frame.structurePressure.toFixed(0)} / 100</p>
          <p className="text-sigflo-muted">
            {MARKET_CONDITIONS_LABEL} {marketConditionLabel(frame.marketRegime as RegimeKind | string)}
          </p>
          <p className="text-sigflo-muted">Momentum {momentumStateLabel(frame.momentumState)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/90">Signal story</p>
        <p className="mt-1 text-[12px] leading-relaxed text-cyan-50/95">{story}</p>
      </div>
      {pressureTimeline.length > 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sigflo-muted">{MARKET_CONDITIONS_CHANGING_TITLE}</p>
            <button
              type="button"
              onClick={() =>
                setAdvancedPanelExpanded('replay-regime-transition-pressure', !isAdvancedPanelExpanded('replay-regime-transition-pressure'))
              }
              className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 transition hover:text-zinc-100"
            >
              {isAdvancedPanelExpanded('replay-regime-transition-pressure') ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-sigflo-muted">
            Read-only snapshot timeline. This is probability-based context, not a price prediction.
          </p>
          {isAdvancedPanelExpanded('replay-regime-transition-pressure') ? (
            <>
          <div className={`mt-2 rounded-lg border px-2 py-1.5 ${compositeTone.badge}`}>
            <div className={`mb-1 flex items-center justify-between text-[10px] ${compositeTone.text}`}>
              <span>{OVERALL_CHANGE_PRESSURE_LABEL.toLowerCase()}</span>
              <span>
                {Math.round(compositeLatest)} ({compositeTone.zone})
              </span>
            </div>
            <svg viewBox="0 0 220 36" className="h-9 w-full" preserveAspectRatio="none">
              <path
                d={compositePressureSeries
                  .map((v, i) => {
                    const n = Math.max(1, compositePressureSeries.length - 1);
                    const x = (i / n) * 220;
                    const y = 36 - (Math.max(0, Math.min(100, v)) / 100) * 32;
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={compositeTone.stroke}
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className={`mt-2 ${advancedLayout === 'expanded' ? 'space-y-1.5' : 'space-y-1'}`}>
            {(
              [
                ['trendToRange', transitionPressureLabel('trendToRange')],
                ['rangeToTrend', transitionPressureLabel('rangeToTrend')],
                ['compressionToExpansion', transitionPressureLabel('compressionToExpansion')],
                ['expansionToCompression', transitionPressureLabel('expansionToCompression')],
                ['stableToVolatile', transitionPressureLabel('stableToVolatile')],
                ['volatileToStable', transitionPressureLabel('volatileToStable')],
              ] as const
            ).map(([k, label]) => {
              const vals = pressureTimeline.map((p) => p.pressures[k]);
              const n = Math.max(1, vals.length - 1);
              const points = vals
                .map((v, i) => {
                  const x = (i / n) * 220;
                  const y = 36 - (Math.max(0, Math.min(100, v)) / 100) * 32;
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join(' ');
              const latest = vals.at(-1) ?? 0;
              return (
                <div key={k} className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{label}</span>
                    <span>{Math.round(latest)}</span>
                  </div>
                  <svg viewBox="0 0 220 36" className="h-9 w-full" preserveAspectRatio="none">
                    <path d={points} fill="none" stroke="rgba(103,232,249,0.85)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-sigflo-muted">
            Latest {CHANGE_RISK_LABEL.toLowerCase()} {Math.round(pressureTimeline.at(-1)?.shiftProbability ?? 0)} / 100 ·{' '}
            {TREND_HEALTH_LABEL.toLowerCase()} {Math.round(pressureTimeline.at(-1)?.regimeStability ?? 0)} / 100
            {pressureTimeline.at(-1)?.likelyNextRegime
              ? ` · likely next conditions: ${marketConditionLabel(pressureTimeline.at(-1)!.likelyNextRegime!)}`
              : ''}
          </p>
            </>
          ) : (
            <p className="mt-2 text-[10px] text-sigflo-muted">
              {OVERALL_CHANGE_PRESSURE_LABEL} {Math.round(compositeLatest)} ({compositeTone.zone}) ·{' '}
              {CHANGE_RISK_LABEL.toLowerCase()}{' '}
              {Math.round(pressureTimeline.at(-1)?.shiftProbability ?? 0)} / 100
            </p>
          )}
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sigflo-muted">Event markers</p>
        <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
          {markers.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="flex w-full items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-left text-[11px] text-white/90 transition-colors hover:border-cyan-500/30 hover:bg-white/[0.04]"
                onClick={() => {
                  setPlayhead(m.frameIndex);
                  setLockedIdx(m.frameIndex);
                }}
              >
                <span className="mt-0.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: markerColor(m.kind) }} />
                <span className="min-w-0">
                  <span className="font-medium">{m.label}</span>
                  <span className="block text-[10px] text-sigflo-muted">{formatTime(m.timestamp)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-[10px] text-sigflo-muted">
        <p className="font-medium text-white/80">Legend</p>
        <p className="mt-1">Gray path: ATR-scaled price arc from stored entry, MFE/MAE, and resolution level.</p>
        <p className="mt-0.5">Gradient path: structural pressure from favorable vs adverse excursion at each frame.</p>
        <p className="mt-0.5">Dashed line: emit-time confidence (0–100), constant because per-bar confidence is not persisted.</p>
      </div>

    </div>
  );
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
