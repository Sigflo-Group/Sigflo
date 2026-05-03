import { motion } from 'framer-motion';
import { getScoreTier } from '@/types/botSystem';

export type TradeReviewHeaderProps = {
  pair: string;
  direction: 'LONG' | 'SHORT';
  setupType: string;
  /** When engine context is still loading or missing, tier line is omitted. */
  score: number | null;
  state: string;
  sourceEngine?: string;
};

function statePillClass(state: string): string {
  const s = state.toLowerCase();
  if (s === 'triggered' || s === 'ready')
    return 'border-[#00ffc8]/35 bg-[#00ffc8]/10 text-[#00ffc8]';
  if (s === 'building' || s === 'watching') return 'border-white/15 bg-white/[0.06] text-zinc-300';
  if (s === 'coolingoff' || s === 'invalidated') return 'border-rose-400/25 bg-rose-500/10 text-rose-200';
  if (s === 'managing') return 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200';
  return 'border-white/10 bg-white/[0.04] text-zinc-400';
}

export function TradeReviewHeader({
  pair,
  direction,
  setupType,
  score,
  state,
  sourceEngine,
}: TradeReviewHeaderProps) {
  const tier = score != null && Number.isFinite(score) ? getScoreTier(score) : null;

  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">From Sigflo Engine</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">{pair}</h1>
          {sourceEngine ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Engine · <span className="text-zinc-400">{sourceEngine}</span>
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statePillClass(state)}`}
        >
          {state}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500">Direction</dt>
          <dd className="mt-0.5 font-semibold text-white">
            <span className={direction === 'LONG' ? 'text-[#00ffc8]' : 'text-rose-300'}>{direction}</span>
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Score</dt>
          <dd className="mt-0.5 font-semibold text-white">
            {score != null && Number.isFinite(score) ? (
              <>
                {score}
                {tier ? <span className="font-normal text-zinc-400"> · {tier}</span> : null}
              </>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-zinc-500">Setup type</dt>
          <dd className="mt-0.5 font-medium text-zinc-200">{setupType || '—'}</dd>
        </div>
      </dl>
    </motion.header>
  );
}
