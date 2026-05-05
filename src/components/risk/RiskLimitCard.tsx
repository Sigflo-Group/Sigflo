import type { ReactNode } from 'react';

type RiskLimitCardProps = {
  title: string;
  description?: ReactNode;
  /** When true, a gentle rose frame (limit attention), not alarm styling. */
  attention?: boolean;
  children: ReactNode;
};

export function RiskLimitCard({ title, description, attention, children }: RiskLimitCardProps) {
  return (
    <section
      className={`rounded-2xl border px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-3.5 ${
        attention
          ? 'border-rose-400/25 bg-rose-500/[0.06]'
          : 'border-white/10 bg-white/[0.035]'
      }`}
    >
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">{title}</h2>
      {description ? <div className="mt-1 text-[10px] leading-snug text-zinc-500">{description}</div> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
