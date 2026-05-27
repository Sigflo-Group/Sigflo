import { playUiTapSound } from '@/utils/sound';
import type { OpportunityCardModel } from '@/types/botSystem';
import { formatFreshness, getScoreTier, getStateStyles, stateLabel } from '@/types/botSystem';

function directionClass(direction: OpportunityCardModel['direction']): string {
  return direction === 'LONG'
    ? 'border-emerald-300/35 bg-emerald-500/12 text-emerald-200'
    : 'border-rose-300/35 bg-rose-500/12 text-rose-200';
}

function glowClass(state: OpportunityCardModel['state']): string {
  return state === 'Ready' || state === 'Triggered' || state === 'Managing'
    ? 'ring-1 ring-[#00ffc8]/30 shadow-[0_0_24px_-16px_rgba(0,255,200,0.6)]'
    : '';
}

export function PriorityOpportunityCard({
  opportunity,
  onReview,
  alertHighlight = false,
  reviewLocked = false,
}: {
  opportunity: OpportunityCardModel;
  onReview?: (id: string) => void;
  alertHighlight?: boolean;
  /** Daily risk guard: no navigation into new trade review. */
  reviewLocked?: boolean;
}) {
  const tier = getScoreTier(opportunity.score);
  const stateStyles = getStateStyles(opportunity.state);
  const pulse =
    !alertHighlight && (opportunity.state === 'Ready' || opportunity.state === 'Triggered');

  return (
    <article
      className={`rounded-2xl border bg-white/[0.045] p-4 backdrop-blur transition ${
        alertHighlight
          ? 'border-[#00ffc8]/50 animate-sigflo-highlight'
          : `border-white/10 ${glowClass(opportunity.state)}`
      } ${pulse ? 'animate-[sigflo-entry-pulse_2.4s_ease-in-out_infinite]' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-base font-bold tracking-tight text-zinc-100">{opportunity.pair}</h2>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${directionClass(opportunity.direction)}`}>
              {opportunity.direction}
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
              {opportunity.score} · {tier}
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stateStyles.pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${stateStyles.dot}`} />
          {stateLabel(opportunity.state)}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-zinc-100">{opportunity.setupType}</p>
      <p className="mt-1 text-xs text-zinc-400">{opportunity.thesis}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Entry</p>
          <p className="mt-0.5 font-mono font-semibold text-zinc-100">{opportunity.entryZone ?? opportunity.entryStatus}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Invalidation</p>
          <p className="mt-0.5 font-mono font-semibold text-rose-200">{opportunity.invalidation ?? 'Pending'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Targets</p>
          <p className="mt-0.5 font-mono font-semibold text-emerald-200">{opportunity.targets?.join(' · ') ?? 'Pending'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Timeframes</p>
          <p className="mt-0.5 font-semibold text-zinc-300">{opportunity.timeframeAlignment?.join(' / ') ?? 'Mixed'}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={reviewLocked}
          onClick={() => {
            if (reviewLocked) return;
            playUiTapSound();
            onReview?.(opportunity.id);
          }}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
            reviewLocked
              ? 'cursor-not-allowed border border-white/10 bg-white/[0.06] text-zinc-500'
              : 'bg-[#00ffc8] text-[#050505] hover:brightness-110'
          }`}
        >
          {reviewLocked ? 'Review locked' : 'Review trade'}
        </button>

        <span className="ml-auto text-[10px] text-zinc-500">{formatFreshness(opportunity.freshnessSec)}</span>
      </div>
    </article>
  );
}

export default PriorityOpportunityCard;
