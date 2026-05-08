import SystemEventRow from '@/components/bots/SystemEventRow';
import type { SystemEventModel } from '@/types/botSystem';

const JOURNAL_EVENT_TYPES = new Set<SystemEventModel['eventType']>([
  'setup_upgraded',
  'setup_invalidated',
  'risk_limit',
  'engine',
]);

export type EngineJournalProps = {
  /** Mock / API events already scoped to this engine. */
  events: SystemEventModel[];
  /** Extra rows (e.g. local pause/resume), newest first. */
  localEvents?: SystemEventModel[];
};

function sortByTimeDesc(a: SystemEventModel, b: SystemEventModel): number {
  return Date.parse(b.timestamp) - Date.parse(a.timestamp);
}

export function EngineJournal({ events, localEvents = [] }: EngineJournalProps) {
  const merged = [...localEvents, ...events].filter((e) => JOURNAL_EVENT_TYPES.has(e.eventType)).sort(sortByTimeDesc);

  return (
    <section>
      <h2 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Journal</h2>
      <p className="mb-2 text-[10px] leading-snug text-zinc-600">Recent signals and checks for this engine.</p>
      {merged.length > 0 ? (
        <div className="space-y-1.5">
          {merged.map((event) => (
            <SystemEventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] text-zinc-500">
          No journal entries for this engine yet.
        </p>
      )}
    </section>
  );
}
