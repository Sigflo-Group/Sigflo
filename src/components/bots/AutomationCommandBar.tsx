import { Link } from 'react-router-dom';
import type { CommandBarModel } from '@/types/botSystem';

function healthColor(health: CommandBarModel['systemHealth']): string {
  if (health === 'Healthy') return 'bg-[#00ffc8]';
  if (health === 'Degraded') return 'bg-amber-300';
  return 'bg-rose-400';
}

export function AutomationCommandBar({
  model,
  setupReadyFlashKey = 0,
  setupReadyBanner = null,
}: {
  model: CommandBarModel;
  /** Bump to replay a one-shot pulse on the status dot when a setup becomes Ready/Triggered. */
  setupReadyFlashKey?: number;
  /** Short-lived banner under the status row. */
  setupReadyBanner?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300">
        <span
          key={setupReadyFlashKey}
          className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${healthColor(model.systemHealth)} ${
            setupReadyFlashKey > 0 ? 'sigflo-cmdbar-ready-pulse' : ''
          }`}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate">
            {model.automationMode} · {model.riskMode} risk · {model.liveExecutionLine ?? 'Live locked'}
          </span>
          <span className="truncate font-normal text-zinc-500">
            {model.capitalDeployedPct}% deployed · {model.exchange}
          </span>
          {model.riskGuardLine ? (
            <span className="truncate font-normal text-zinc-500">{model.riskGuardLine}</span>
          ) : null}
        </span>
      </div>
      {setupReadyBanner ? (
        <p className="mt-1.5 text-[10px] font-medium text-[#a8e8d8] transition-opacity duration-300">{setupReadyBanner}</p>
      ) : null}
      <div className="mt-2 flex justify-end border-t border-white/[0.08] pt-2">
        <Link
          to="/risk"
          className="text-[10px] font-semibold uppercase tracking-wide text-[#7ee8d3] underline-offset-2 transition hover:text-[#b8f5e6] hover:underline"
        >
          Risk controls
        </Link>
      </div>
    </section>
  );
}

export default AutomationCommandBar;
