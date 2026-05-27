/**
 * MarketPostureBar
 *
 * The primary, synthesised interpretation of the current signal state.
 * Renders ONE coherent market posture instead of exposing multiple raw detector
 * outputs that users would have to mentally reconcile themselves.
 *
 * Usage:
 *   <MarketPostureBar signal={signal} status={marketStatus} />
 *
 * The `interp` prop is optional — pass it if you have already called
 * interpretSignal() to avoid recomputing on every render.
 */

import { useMemo } from 'react';
import {
  interpretSignal,
  type SignalInterpretation,
} from '@/lib/signalInterpretation';
import type { CryptoSignal } from '@/types/signal';
import type { MarketRowStatus } from '@/types/markets';

// ─── colour tokens ────────────────────────────────────────────────────────────

const POSTURE_TOKENS = {
  emerald: {
    badge:    'border-emerald-400/35 bg-emerald-500/10 text-emerald-300',
    dot:      'bg-emerald-400',
    headline: 'text-emerald-100/90',
    note:     'text-emerald-200/70',
  },
  cyan: {
    badge:    'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
    dot:      'bg-cyan-400',
    headline: 'text-cyan-100/90',
    note:     'text-cyan-200/70',
  },
  amber: {
    badge:    'border-amber-400/30 bg-amber-500/8 text-amber-300',
    dot:      'bg-amber-400',
    headline: 'text-amber-100/90',
    note:     'text-amber-200/70',
  },
  slate: {
    badge:    'border-slate-400/22 bg-slate-500/8 text-slate-300',
    dot:      'bg-slate-500',
    headline: 'text-slate-200/80',
    note:     'text-slate-400/80',
  },
} as const;

const CHASE_RISK_TOKENS: Record<SignalInterpretation['chaseRisk'], string> = {
  low:      'border-emerald-400/20 bg-emerald-500/6 text-emerald-300/80',
  moderate: 'border-amber-400/22 bg-amber-500/6 text-amber-300/80',
  high:     'border-rose-400/28 bg-rose-500/8 text-rose-300',
};

const CONFIDENCE_TOKEN = 'border-white/[0.1] bg-white/[0.04] text-white/60';

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  signal: CryptoSignal;
  status: MarketRowStatus;
  /** Pre-computed interpretation — skips recomputation when already available. */
  interp?: SignalInterpretation;
  /**
   * compact: chips only, no headline sentence (good for tight card footers).
   * normal (default): chips + headline + supporting note.
   * headline: chips + headline only (no note).
   */
  variant?: 'compact' | 'normal' | 'headline';
};

export function MarketPostureBar({ signal, status, interp, variant = 'normal' }: Props) {
  const i = useMemo(
    () => interp ?? interpretSignal(signal, status),
    [interp, signal, status],
  );
  const c = POSTURE_TOKENS[i.postureColor];

  return (
    <div className="space-y-2">
      {/* Chip row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Posture — always visible */}
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c.badge}`}
        >
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} aria-hidden />
          {i.postureLabel}
        </span>

        {/* Confidence tier */}
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CONFIDENCE_TOKEN}`}
        >
          {i.confidenceLabel}
        </span>

        {/* Chase risk — only show when it's not 'low' to reduce noise */}
        {i.chaseRisk !== 'low' ? (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CHASE_RISK_TOKENS[i.chaseRisk]}`}
          >
            {i.chaseRiskLabel}
          </span>
        ) : null}
      </div>

      {/* Action headline ───────────────────────────────────────────── */}
      {variant !== 'compact' ? (
        <p className={`text-[12px] font-medium leading-snug ${c.headline}`}>
          {i.actionHeadline}
        </p>
      ) : null}

      {/* Supporting note ───────────────────────────────────────────── */}
      {variant === 'normal' ? (
        <p className={`text-[11px] leading-snug ${c.note}`}>{i.supportingNote}</p>
      ) : null}
    </div>
  );
}
