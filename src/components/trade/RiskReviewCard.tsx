import { motion } from 'framer-motion';
import { getScoreTier } from '@/types/botSystem';
import type { SigfloRiskMode } from '@/types/risk';

export type RiskReviewCardProps = {
  score: number | null;
  riskLabel?: 'Low' | 'Medium' | 'High';
  state: string;
  userRiskMode?: SigfloRiskMode;
  maxRiskPerTradePct?: number;
  maxOpenPositions?: number;
  allowLiveExecution?: boolean;
  requireConfirmation?: boolean;
  monitoredOpenCount?: number;
};

function readinessCopy(state: string): string {
  const s = state.replace(/[\s_]/g, '').toLowerCase();
  if (s === 'ready' || s === 'triggered' || s === 'managing') return 'Reviewable';
  if (s === 'building' || s === 'watching') return 'Wait for confirmation';
  if (s === 'coolingoff' || s === 'invalidated') return 'Do not enter';
  if (s === 'completed') return 'Closed — review only';
  return 'Assess carefully';
}

function riskTone(label?: 'Low' | 'Medium' | 'High'): string {
  if (label === 'Low') return 'text-[#00ffc8]/90';
  if (label === 'High') return 'text-amber-200/90';
  return 'text-amber-200/90';
}

export function RiskReviewCard({
  score,
  riskLabel,
  state,
  userRiskMode,
  maxRiskPerTradePct,
  maxOpenPositions,
  allowLiveExecution,
  requireConfirmation,
  monitoredOpenCount,
}: RiskReviewCardProps) {
  const tier = score != null && Number.isFinite(score) ? getScoreTier(score) : null;
  const profile = userRiskMode != null && maxRiskPerTradePct != null && maxOpenPositions != null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Risk read</h2>
      <dl className="mt-2 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
          <dt className="text-zinc-500">Setup risk label</dt>
          <dd className={`font-semibold ${riskTone(riskLabel)}`}>{riskLabel ?? '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
          <dt className="text-zinc-500">Setup score tier</dt>
          <dd className="font-medium text-zinc-200">{tier ?? '—'}</dd>
        </div>
        {profile ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <dt className="text-zinc-500">Your risk mode</dt>
              <dd className="font-medium text-zinc-100">{userRiskMode} mode</dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <dt className="text-zinc-500">Max risk per trade</dt>
              <dd className="font-mono font-medium text-zinc-200">
                {Number(maxRiskPerTradePct.toFixed(2))}% max risk per trade
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <dt className="text-zinc-500">Max open positions</dt>
              <dd className="font-mono font-medium text-zinc-200">
                {monitoredOpenCount ?? '—'} open · cap {maxOpenPositions}
              </dd>
            </div>
            <div className="space-y-1.5 border-b border-white/[0.06] pb-2 pt-0.5">
              <dt className="text-zinc-500">Execution readiness</dt>
              <dd className="space-y-1 text-[11px] font-normal leading-snug text-zinc-300">
                <p className="text-zinc-200">{readinessCopy(state)}</p>
                <p>{allowLiveExecution ? 'Live execution available in Risk controls.' : 'Live execution locked'}</p>
                {requireConfirmation ? <p>Confirmation required</p> : <p>Confirmation optional</p>}
              </dd>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-0.5 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-zinc-500">Execution readiness</dt>
            <dd className="font-medium text-zinc-100">{readinessCopy(state)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-[10px] leading-snug text-zinc-500">
        Outcomes are not guaranteed. This is a structured read for review only.
      </p>
    </motion.section>
  );
}
