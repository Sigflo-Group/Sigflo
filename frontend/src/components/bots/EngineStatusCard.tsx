import { AnimatePresence, motion } from 'framer-motion';
import type { EngineStatusModel } from '@/types/botSystem';
import { playUiTapSound } from '@/utils/sound';

function healthDot(health: EngineStatusModel['health']): string {
  if (health === 'Healthy') return 'bg-[#00ffc8]';
  if (health === 'Degraded') return 'bg-amber-300';
  return 'bg-rose-400';
}

function stateLabel(state: EngineStatusModel['state'] | 'Paused'): string {
  if (state === 'ManagingTrade') return 'Managing trade';
  if (state === 'ConnectionIssue') return 'Connection issue';
  if (state === 'RiskLimited') return 'Risk limited';
  if (state === 'CoolingOff') return 'Cooling off';
  if (state === 'Paused') return 'Paused';
  return state;
}

export type EngineScanIntel = {
  /** Count of Building / Watching setups (global). */
  setupsForming: number;
  /** Up to two forming setups (pair + plain-English explanation). */
  formingTopSetups: { pair: string; explanation: string }[];
  /** One-line latest activity (e.g. pair + state + time). */
  latestActivityLine: string | null;
};

function AnimatedScanNumber({
  value,
  valueKey,
}: {
  value: number;
  valueKey: string;
}) {
  return (
    <span className="inline-flex min-w-[1.5ch] justify-end tabular-nums font-semibold text-zinc-200">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={valueKey}
          initial={{ opacity: 0.45, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0.25, y: -3 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function EngineStatusCard({
  engine,
  intel,
  onView,
  onPauseToggle,
  onViewForming,
  isPausedLocally = false,
}: {
  engine: EngineStatusModel;
  /** When set, replaces static “watching / candidates” copy. */
  intel?: EngineScanIntel | null;
  onView?: (id: string) => void;
  /** Local UI only: toggles between Pause and Resume on this device. */
  onPauseToggle?: (engineId: string) => void;
  onViewForming?: () => void;
  isPausedLocally?: boolean;
}) {
  const formingCount = intel?.setupsForming ?? engine.liveCandidates;
  const formingTopSetups = intel?.formingTopSetups ?? [];
  const latestBody = isPausedLocally
    ? 'Engine paused locally'
    : intel?.latestActivityLine?.trim() || engine.latestOutput;

  const displayState = isPausedLocally ? ('Paused' as const) : engine.state;

  return (
    <article
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-opacity duration-200 ${
        isPausedLocally ? 'opacity-[0.72]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-zinc-100">{engine.engineName}</p>
          <p className="text-[11px] text-zinc-400">{engine.strategyType}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
          <span className={`h-1.5 w-1.5 rounded-full ${healthDot(engine.health)}`} />
          {engine.health}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-200">
          {engine.mode}
        </span>
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-zinc-400">
          {stateLabel(displayState)}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-[11px] text-zinc-400">
        <p>
          Scanning{' '}
          <AnimatedScanNumber
            value={engine.pairsWatched}
            valueKey={`pairs-${engine.engineId}-${engine.pairsWatched}`}
          />{' '}
          pairs
        </p>
        <p>
          <AnimatedScanNumber
            value={formingCount}
            valueKey={`forming-${engine.engineId}-${formingCount}`}
          />{' '}
          setup{formingCount === 1 ? '' : 's'} forming
        </p>
        {formingTopSetups.length > 0 ? (
          <ul className="mt-1 space-y-1.5 text-zinc-500">
            {formingTopSetups.map((item) => (
              <li key={`${item.pair}-${item.explanation}`} className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1">
                <p className="text-[11px] font-semibold text-zinc-300">{item.pair}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{item.explanation}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-zinc-500">
        Latest: <span className="text-zinc-400">{latestBody}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {onViewForming ? (
          <button
            type="button"
            onClick={() => {
              playUiTapSound();
              onViewForming();
            }}
            className="rounded-lg border border-[#00ffc8]/25 bg-[#00ffc8]/8 px-2.5 py-1.5 text-[11px] font-semibold text-[#9fe8d6] transition hover:border-[#00ffc8]/40 hover:bg-[#00ffc8]/12 active:scale-[0.98]"
          >
            View forming setups
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            playUiTapSound();
            onView?.(engine.engineId);
          }}
          className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:border-white/20 active:scale-[0.98]"
        >
          View engine
        </button>
        <button
          type="button"
          onClick={() => {
            playUiTapSound();
            onPauseToggle?.(engine.engineId);
          }}
          className={
            isPausedLocally
              ? 'rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-200 transition hover:border-cyan-200/45 active:scale-[0.98]'
              : 'rounded-lg border border-amber-300/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:border-amber-200/45 active:scale-[0.98]'
          }
        >
          {isPausedLocally ? 'Resume' : 'Pause'}
        </button>
      </div>
    </article>
  );
}

export default EngineStatusCard;
