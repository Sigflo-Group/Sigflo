/**
 * SetupContextCard
 *
 * Compact 2-line card shown on the Trade screen below the scanner insight.
 * Uses the synthesis layer so users see calm, decision-oriented language
 * instead of raw scores and quant labels.
 */

import { useMemo } from 'react';
import { deriveMarketStatus } from '@/lib/marketScannerRows';
import { interpretSignal } from '@/lib/signalInterpretation';
import type { CryptoSignal } from '@/types/signal';
import type { MarketRowStatus } from '@/types/markets';

const POSTURE_BADGE: Record<'emerald' | 'cyan' | 'amber' | 'slate', string> = {
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  cyan:    'border-cyan-400/25 bg-cyan-500/8 text-cyan-300',
  amber:   'border-amber-400/25 bg-amber-500/8 text-amber-300',
  slate:   'border-slate-400/18 bg-slate-500/6 text-slate-300',
};

const POSTURE_DOT: Record<'emerald' | 'cyan' | 'amber' | 'slate', string> = {
  emerald: 'bg-emerald-400',
  cyan:    'bg-cyan-400',
  amber:   'bg-amber-400',
  slate:   'bg-slate-500',
};

const ACTION_COLOR: Record<'emerald' | 'cyan' | 'amber' | 'slate', string> = {
  emerald: 'text-emerald-200/90',
  cyan:    'text-cyan-200/80',
  amber:   'text-amber-200/80',
  slate:   'text-sigflo-muted',
};

export function SetupContextCard({
  signal,
  status: statusProp,
}: {
  signal: CryptoSignal;
  status?: MarketRowStatus;
}) {
  const status = statusProp ?? deriveMarketStatus(signal);
  const interp = useMemo(() => interpretSignal(signal, status), [signal, status]);
  const isLowData = signal.setupScore < 45 && status === 'idle';
  const badge = POSTURE_BADGE[interp.postureColor];
  const dot = POSTURE_DOT[interp.postureColor];
  const actionColor = ACTION_COLOR[interp.postureColor];

  if (isLowData) {
    return (
      <div className="rounded-2xl border border-white/[0.05] bg-sigflo-surface sigflo-panel-texture p-3">
        <p className="text-[11px] text-sigflo-muted">
          Waiting for more history — the setup will sharpen as candles form.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-2.5">
      {/* Posture + patience chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge}`}>
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
          {interp.postureLabel}
        </span>
        <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/55">
          {interp.confidenceLabel}
        </span>
      </div>

      {/* Action line */}
      <p className={`mt-2 text-[11px] font-semibold leading-snug ${actionColor}`}>
        {interp.patienceLabel} — {interp.actionHeadline}
      </p>
    </div>
  );
}
