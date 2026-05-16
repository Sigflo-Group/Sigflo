import { BOT_SCAN_CHIPS } from '@/lib/marketConditionsCopy';

/**
 * Premium empty state when no priority / high-quality setup is available.
 * Animations are CSS-only; disabled under `prefers-reduced-motion`.
 */
export default function ScanningStateCard() {
  return (
    <div
      className="sigflo-scanning-card rounded-[28px] border border-white/10 bg-white/[0.035] p-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">No qualified setup yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Engines are scanning for high-quality conditions.
          </p>
          <div className="sigflo-scanning-sweep-line mt-4 h-px w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="sigflo-scanning-sweep-line__bar" aria-hidden />
          </div>
        </div>
        <div className="sigflo-radar shrink-0" aria-hidden>
          <div className="sigflo-radar__glow" />
          <div className="sigflo-radar__ring" />
          <div className="sigflo-radar__orbit">
            <div className="sigflo-radar__dot" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {BOT_SCAN_CHIPS.map((label, i) => (
          <div
            key={label}
            className="sigflo-scanning-chip rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium leading-snug text-zinc-400"
            style={{ animationDelay: `${i * 0.55}s` }}
          >
            {label}
          </div>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-2 text-[11px] leading-snug text-zinc-500">
        <span className="sigflo-scanning-foot-dot shrink-0 rounded-full bg-[#00ffc8]/75" aria-hidden />
        Next strong setup appears here.
      </p>
    </div>
  );
}
