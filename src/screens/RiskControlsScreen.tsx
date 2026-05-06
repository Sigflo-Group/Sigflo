import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ExecutionSafetyCard } from '@/components/risk/ExecutionSafetyCard';
import { RiskLimitCard } from '@/components/risk/RiskLimitCard';
import { RiskModeSelector } from '@/components/risk/RiskModeSelector';
import { getRiskSettings, saveRiskSettings, useRiskSettings } from '@/services/risk/riskSettings';
import type { SigfloRiskMode, SigfloRiskSettings } from '@/types/risk';

function NumField({
  value,
  onCommit,
  min,
  max,
  step,
  suffix,
}: {
  value: number;
  onCommit: (n: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        onChange={(e) => onCommit(Number(e.target.value))}
        className="w-full max-w-[7rem] rounded-lg border border-white/12 bg-black/40 px-2 py-1.5 font-mono text-[12px] text-zinc-100 outline-none transition focus:border-[#00ffc8]/40"
      />
      <span className="text-[10px] font-medium text-zinc-500">{suffix}</span>
    </div>
  );
}

export default function RiskControlsScreen() {
  const draft = useRiskSettings();

  const persist = useCallback((patch: Partial<SigfloRiskSettings>) => {
    saveRiskSettings({ ...getRiskSettings(), ...patch });
  }, []);

  const setMode = useCallback((riskMode: SigfloRiskMode) => persist({ riskMode }), [persist]);

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-24 pt-4">
      <div className="mx-auto w-full max-w-lg space-y-4 px-4">
        <Link
          to="/bots"
          className="inline-block text-[10px] font-semibold uppercase tracking-wide text-[#7ee8d3] underline-offset-2 hover:underline"
        >
          ← Bots
        </Link>

        <header className="space-y-1.5">
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">Risk controls</h1>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Set the limits Sigflo must respect before any trade is reviewed or executed.
          </p>
        </header>

        <RiskLimitCard
          title="Risk mode"
          description="How assertive discovery and sizing cues should feel. Hard limits below always apply."
        >
          <RiskModeSelector value={draft.riskMode} onChange={setMode} />
        </RiskLimitCard>

        <RiskLimitCard
          title="Per-trade risk"
          description="Ceiling for how much of your plan Sigflo should treat as at stake on a single ticket."
        >
          <NumField
            value={draft.maxRiskPerTradePct}
            min={0.1}
            max={25}
            step={0.1}
            suffix="% (max)"
            onCommit={(maxRiskPerTradePct) => persist({ maxRiskPerTradePct })}
          />
        </RiskLimitCard>

        <RiskLimitCard
          title="Daily loss limit"
          description="Soft cap for a single session — enforcement will respect this once portfolio sync lands."
        >
          <NumField
            value={draft.maxDailyLossPct}
            min={0.5}
            max={50}
            step={0.5}
            suffix="% (soft cap)"
            onCommit={(maxDailyLossPct) => persist({ maxDailyLossPct })}
          />
        </RiskLimitCard>

        <RiskLimitCard
          title="Max open positions"
          description="How many concurrent tickets Sigflo should assume across pairs."
        >
          <NumField
            value={draft.maxOpenPositions}
            min={1}
            max={25}
            step={1}
            suffix="open"
            onCommit={(maxOpenPositions) => persist({ maxOpenPositions })}
          />
        </RiskLimitCard>

        <ExecutionSafetyCard
          value={{
            allowLiveExecution: draft.allowLiveExecution,
            requireConfirmation: draft.requireConfirmation,
            paperModeDefault: draft.paperModeDefault,
          }}
          onChange={(v) => persist(v)}
        />

        <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[10px] leading-relaxed text-zinc-500">
          Nothing on this page places orders. Preferences are saved on this device only for now.
        </p>
      </div>
    </div>
  );
}
