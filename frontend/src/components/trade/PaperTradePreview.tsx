import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { calculatePaperTrade } from '@/utils/tradeMath';
import type { PaperTradeResult } from '@/types/paperTrade';

export type PaperTradePreviewProps = {
  entryPrice: number;
  stopPrice: number;
  targets: number[];
  direction: 'LONG' | 'SHORT';
  onInteraction?: () => void;
  /** When false, risk math is hidden — plan levels are invalid for this direction. */
  previewEnabled?: boolean;
  previewDisabledReason?: string | null;
  /** Bump to play a one-shot highlight after chart drag (parent clears not required). */
  highlightPulseToken?: number;
  /** Upper bound for risk % from Risk controls until advanced unlock. */
  maxRiskPerTradePct: number;
};

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const d = abs >= 100 ? 0 : abs >= 1 ? 2 : 3;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
}

function fmtPx(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function fmtSize(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}k`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 0 });
}

const SLIDER_MIN = 0.25;
const ADVANCED_SLIDER_MAX = 25;

export function PaperTradePreview({
  entryPrice,
  stopPrice,
  targets,
  direction,
  onInteraction,
  previewEnabled = true,
  previewDisabledReason,
  highlightPulseToken = 0,
  maxRiskPerTradePct,
}: PaperTradePreviewProps) {
  const [balance, setBalance] = useState(1000);
  const [advancedRiskUnlocked, setAdvancedRiskUnlocked] = useState(false);
  const [riskPercent, setRiskPercent] = useState(() =>
    Math.min(Math.max(SLIDER_MIN, maxRiskPerTradePct), ADVANCED_SLIDER_MAX),
  );
  const [pulseClass, setPulseClass] = useState(false);
  const interactionFired = useRef(false);
  const prevPulseRef = useRef(highlightPulseToken);

  const policyCap = Math.max(SLIDER_MIN, maxRiskPerTradePct);
  const sliderMax = advancedRiskUnlocked ? ADVANCED_SLIDER_MAX : policyCap;

  useEffect(() => {
    setRiskPercent((p) => {
      if (advancedRiskUnlocked) return Math.min(ADVANCED_SLIDER_MAX, Math.max(SLIDER_MIN, p));
      return Math.min(policyCap, Math.max(SLIDER_MIN, p));
    });
  }, [advancedRiskUnlocked, policyCap]);

  useEffect(() => {
    if (highlightPulseToken > 0 && highlightPulseToken !== prevPulseRef.current) {
      prevPulseRef.current = highlightPulseToken;
      setPulseClass(true);
      const t = window.setTimeout(() => setPulseClass(false), 1400);
      return () => window.clearTimeout(t);
    }
  }, [highlightPulseToken]);

  const fireInteraction = () => {
    if (interactionFired.current) return;
    interactionFired.current = true;
    onInteraction?.();
  };

  const result: PaperTradeResult | null = useMemo(() => {
    if (!previewEnabled) return null;
    return calculatePaperTrade({
      balance,
      riskPercent,
      entryPrice,
      stopPrice,
      targets,
      direction,
    });
  }, [balance, riskPercent, entryPrice, stopPrice, targets, direction, previewEnabled]);

  const showPolicyNote = !advancedRiskUnlocked;
  const showAboveCapHint = advancedRiskUnlocked && riskPercent > policyCap + 1e-6;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm ${
        pulseClass ? 'animate-sigflo-paper-preview-pulse' : ''
      }`}
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Paper Trade Preview
        <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-600">· Plan only</span>
      </h2>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500">
        If you took this trade, here is the structure. Illustrative only — not financial advice.
      </p>

      {!previewEnabled && previewDisabledReason ? (
        <p
          className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-2 text-[11px] leading-snug text-amber-200/95"
          role="status"
        >
          {previewDisabledReason}
        </p>
      ) : null}

      <div
        className={`mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 ${!previewEnabled ? 'pointer-events-none opacity-[0.38]' : ''}`}
      >
        <label className="grid gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Balance (simulated)</span>
          <input
            type="number"
            min={1}
            step={100}
            value={Number.isFinite(balance) ? balance : ''}
            onChange={(e) => {
              fireInteraction();
              const v = Number(e.target.value);
              setBalance(Number.isFinite(v) && v > 0 ? v : 1000);
            }}
            disabled={!previewEnabled}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100 outline-none ring-0 focus:border-[#00ffc8]/40 disabled:cursor-not-allowed"
          />
        </label>
        <div className="grid gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Risk % of balance ({riskPercent.toFixed(2)}%)
          </span>
          <input
            type="range"
            aria-label="Risk percent of simulated balance"
            min={SLIDER_MIN}
            max={sliderMax}
            step={0.25}
            value={Math.min(riskPercent, sliderMax)}
            onChange={(e) => {
              fireInteraction();
              const v = Number(e.target.value);
              setRiskPercent(Number.isFinite(v) ? v : SLIDER_MIN);
            }}
            disabled={!previewEnabled}
            className="mt-1.5 w-full accent-[#00ffc8] disabled:cursor-not-allowed"
          />
          {showPolicyNote ? (
            <p className="text-[9px] leading-snug text-zinc-500">Limited by your risk controls</p>
          ) : null}
          {showAboveCapHint ? (
            <p className="text-[9px] leading-snug text-amber-200/80">Above your saved per-trade cap — advanced override</p>
          ) : null}
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-[9px] text-zinc-500">
            <input
              type="checkbox"
              checked={advancedRiskUnlocked}
              onChange={(e) => {
                fireInteraction();
                setAdvancedRiskUnlocked(e.target.checked);
              }}
              disabled={!previewEnabled}
              className="h-3.5 w-3.5 rounded border-white/20 bg-black/40 text-cyan-500"
            />
            <span>Advanced sizing (unlock higher risk %)</span>
          </label>
        </div>
      </div>

      <div
        className={`mt-3 grid gap-1.5 border-t border-white/[0.06] pt-3 text-xs ${
          !previewEnabled || result == null ? 'opacity-40' : ''
        }`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5">
          <span className="text-zinc-500">Entry (plan)</span>
          <span className="text-right font-medium tabular-nums text-zinc-200">{fmtPx(entryPrice)}</span>
          <span className="text-zinc-500">Stop / invalidation</span>
          <span className="text-right font-medium tabular-nums text-zinc-200">{fmtPx(stopPrice)}</span>
          {result ? (
            <>
              <span className="text-zinc-500">Position size (units)</span>
              <span className="text-right font-medium tabular-nums text-zinc-200">{fmtSize(result.positionSize)}</span>
              <span className="text-zinc-500">Risk amount</span>
              <span className="text-right font-medium tabular-nums text-zinc-200">{fmtUsd(result.riskAmount)}</span>
              <span className="text-zinc-500">Loss at stop</span>
              <span className="text-right font-medium tabular-nums text-rose-300/90">{fmtUsd(-result.lossAtStop)}</span>
            </>
          ) : (
            <>
              <span className="text-zinc-500">Position size (units)</span>
              <span className="text-right font-medium tabular-nums text-zinc-500">—</span>
              <span className="text-zinc-500">Risk amount</span>
              <span className="text-right font-medium tabular-nums text-zinc-500">—</span>
              <span className="text-zinc-500">Loss at stop</span>
              <span className="text-right font-medium tabular-nums text-zinc-500">—</span>
            </>
          )}
        </div>
      </div>

      {result && result.profitTargets.length > 0 ? (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Targets</p>
          <ul className="mt-2 grid gap-1.5">
            {result.profitTargets.map((row, i) => {
              const win = row.pnl >= 0;
              return (
                <li
                  key={`${row.price}-${i}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 text-xs"
                >
                  <span className="text-zinc-500">T{i + 1}</span>
                  <span className="min-w-0 truncate text-right font-medium tabular-nums text-zinc-200">
                    {fmtPx(row.price)}
                  </span>
                  <span
                    className={`text-right font-semibold tabular-nums ${win ? 'text-[#00ffc8]' : 'text-rose-300/85'}`}
                  >
                    {row.pnl >= 0 ? '+' : ''}
                    {fmtUsd(row.pnl)}
                  </span>
                  <span className={`text-right tabular-nums ${win ? 'text-[#00ffc8]/80' : 'text-rose-300/70'}`}>
                    {Number.isFinite(row.rr) ? `${row.rr.toFixed(2)}R` : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : previewEnabled && targets.length > 0 && result == null ? (
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-zinc-500">Unable to compute preview for these levels.</p>
      ) : null}

      <p className="mt-3 text-[10px] leading-snug text-zinc-500">
        Simulation only. No real orders placed. Does not model fees, slippage, or liquidation.
      </p>
    </motion.section>
  );
}
