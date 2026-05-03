import type { SigfloRiskMode } from '@/types/risk';

const MODES: SigfloRiskMode[] = ['Defensive', 'Balanced', 'Aggressive'];

const BLURBS: Record<SigfloRiskMode, string> = {
  Defensive: 'Tighter bands, fewer marginal setups.',
  Balanced: 'Default pacing for most traders.',
  Aggressive: 'More room for velocity — still bounded by your limits below.',
};

type RiskModeSelectorProps = {
  value: SigfloRiskMode;
  onChange: (mode: SigfloRiskMode) => void;
};

export function RiskModeSelector({ value, onChange }: RiskModeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => {
          const active = value === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={`min-w-[5.5rem] flex-1 rounded-xl border px-2.5 py-2 text-left transition sm:min-w-0 sm:flex-none ${
                active
                  ? 'border-[#00ffc8]/45 bg-[rgba(0,255,200,0.12)] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/16 hover:text-zinc-200'
              }`}
            >
              <span className="block text-[11px] font-bold tracking-wide">{m}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-zinc-500">{BLURBS[value]}</p>
    </div>
  );
}
