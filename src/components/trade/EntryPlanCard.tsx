import { motion } from 'framer-motion';

export type EntryPlanCardProps = {
  direction: 'LONG' | 'SHORT';
  entryZone?: string;
  invalidation?: string;
  targets?: string[];
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/[0.06] py-2 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <div className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="min-w-0 text-right text-xs font-medium text-zinc-100 sm:text-left">{value}</div>
    </div>
  );
}

export function EntryPlanCard({ direction, entryZone, invalidation, targets }: EntryPlanCardProps) {
  const targetsLine = targets?.length ? targets.join(' · ') : '—';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Entry plan</h2>
      <p className="mt-1 text-[11px] text-zinc-500">
        Bias:{' '}
        <span className={direction === 'LONG' ? 'font-semibold text-[#00ffc8]' : 'font-semibold text-rose-300'}>
          {direction}
        </span>
      </p>
      <div className="mt-1">
        <Row label="Entry zone" value={entryZone?.trim() || '—'} />
        <Row label="Invalidation / stop logic" value={invalidation?.trim() || '—'} />
        <Row label="Targets" value={targetsLine} />
      </div>
    </motion.section>
  );
}
