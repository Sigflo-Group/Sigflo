import type { WhyThisTradeModel } from '@/lib/whyThisTrade';

function Section({
  title,
  items,
  icon,
  tone = 'neutral',
}: {
  title: string;
  items: string[];
  icon: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'warning';
}) {
  if (items.length === 0) return null;
  const toneClasses =
    tone === 'positive'
      ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
      : tone === 'negative'
        ? 'border-rose-500/25 bg-rose-500/[0.06]'
        : tone === 'warning'
          ? 'border-amber-500/25 bg-amber-500/[0.06]'
          : 'border-white/[0.08] bg-black/25';
  const bulletTone =
    tone === 'positive'
      ? 'text-emerald-300/80'
      : tone === 'negative'
        ? 'text-rose-300/80'
        : tone === 'warning'
          ? 'text-amber-300/80'
          : 'text-cyan-300/75';
  return (
    <div className={`rounded-xl border p-2.5 ${toneClasses}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">
        <span className="mr-1" aria-hidden>
          {icon}
        </span>
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={`${title}-${item}`} className="flex gap-1.5 text-[11px] leading-snug text-white/90">
            <span className={bulletTone} aria-hidden>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhyThisTradePanel({ model }: { model: WhyThisTradeModel }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-sigflo-surface sigflo-panel-texture p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">
            <span className="mr-1" aria-hidden>
              🧠
            </span>
            Why this trade?
          </p>
          <p className="mt-0.5 text-sm font-bold text-white">{model.bias}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-sigflo-muted">
            Confidence <span className="font-semibold text-cyan-200">{model.confidence}%</span>
          </p>
          <p className="text-[11px] text-sigflo-muted">
            Setup quality <span className="font-semibold text-white">{model.setupQuality}%</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted/90">
            HTF {model.higherTimeframeBias}
          </p>
        </div>
      </div>

      {model.primaryDriver ? (
        <div className="mt-2 rounded-xl border border-cyan-400/18 bg-cyan-500/[0.06] p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/85">
            <span className="mr-1" aria-hidden>
              🎯
            </span>
            Primary driver
          </p>
          <p className="mt-1 text-[12px] leading-snug text-white/95">{model.primaryDriver}</p>
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Section title="Secondary drivers" icon="➕" tone="neutral" items={model.secondaryDrivers} />
        <Section title="Minor factors" icon="🔎" tone="neutral" items={model.minorFactors} />
        <Section title="Key bullish factors" icon="📈" tone="positive" items={model.bullishFactors} />
        <Section title="Key bearish factors" icon="📉" tone="negative" items={model.bearishFactors} />
        <Section title="Risks" icon="⚠️" tone="warning" items={model.risks} />
        <Section title="Invalidation conditions" icon="🛑" tone="negative" items={model.invalidation} />
      </div>
    </div>
  );
}
