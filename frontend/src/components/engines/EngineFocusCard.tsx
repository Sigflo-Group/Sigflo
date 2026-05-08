import { engineFocusLine } from '@/components/engines/engineFocusCopy';

export type EngineFocusCardProps = {
  engineId: string;
};

export function EngineFocusCard({ engineId }: EngineFocusCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">What it does</h2>
      <p className="mt-1.5 text-[13px] leading-snug text-zinc-300">{engineFocusLine(engineId)}</p>
    </section>
  );
}
