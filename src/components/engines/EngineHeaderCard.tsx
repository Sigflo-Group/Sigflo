import type { EngineStatusModel } from '@/types/botSystem';

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

export type EngineHeaderCardProps = {
  engine: EngineStatusModel;
  /** Local-only pause overlay (this device). */
  isPausedLocally: boolean;
};

export function EngineHeaderCard({ engine, isPausedLocally }: EngineHeaderCardProps) {
  const displayState = isPausedLocally ? ('Paused' as const) : engine.state;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Engine</p>
          <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight text-zinc-100">{engine.engineName}</h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">{engine.strategyType}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
          <span className={`h-1.5 w-1.5 rounded-full ${healthDot(engine.health)}`} />
          {engine.health}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-cyan-300/28 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200/95">
          {engine.mode}
        </span>
        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
          {isPausedLocally ? 'Paused · local UI' : stateLabel(displayState)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
        <div>
          <dt className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">Watching</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-100">{engine.pairsWatched}</dd>
        </div>
        <div>
          <dt className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">Candidates</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-100">{engine.liveCandidates}</dd>
        </div>
        <div>
          <dt className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">Positions</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-100">{engine.activePositions}</dd>
        </div>
      </dl>

      <p className="mt-2.5 border-t border-white/[0.06] pt-2.5 text-[11px] leading-snug text-zinc-500">
        Latest: <span className="text-zinc-400">{isPausedLocally ? 'Engine paused locally' : engine.latestOutput}</span>
      </p>
    </section>
  );
}
