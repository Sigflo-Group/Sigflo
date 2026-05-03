import OpportunityRowCard from '@/components/bots/OpportunityRowCard';
import type { OpportunityCardModel } from '@/types/botSystem';

export type EngineOpportunityListProps = {
  loading: boolean;
  opportunities: OpportunityCardModel[];
  onSelect: (id: string) => void;
};

export function EngineOpportunityList({ loading, opportunities, onSelect }: EngineOpportunityListProps) {
  return (
    <section>
      <h2 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Forming for this engine</h2>
      <p className="mb-2 text-[10px] leading-snug text-zinc-600">Building or watching setups tied to this engine in the demo feed.</p>
      {loading ? (
        <p className="text-[11px] text-zinc-500">Loading…</p>
      ) : opportunities.length > 0 ? (
        <div className="space-y-1.5">
          {opportunities.map((row) => (
            <OpportunityRowCard key={row.id} opportunity={row} variant="muted" onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] leading-snug text-zinc-500">
          No setups forming for this engine right now.
        </p>
      )}
    </section>
  );
}
