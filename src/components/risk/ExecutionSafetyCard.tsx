type RowProps = {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

function ToggleRow({ label, helper, checked, onChange, disabled }: RowProps) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-white/12'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-zinc-200">{label}</span>
        <span className="mt-0.5 block text-[9px] leading-snug text-zinc-500">{helper}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-[#00ffc8]/35' : 'bg-zinc-700/80'
        } ${disabled ? '' : 'hover:brightness-110'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export type ExecutionSafetyValues = {
  allowLiveExecution: boolean;
  requireConfirmation: boolean;
  paperModeDefault: boolean;
};

type ExecutionSafetyCardProps = {
  value: ExecutionSafetyValues;
  onChange: (next: ExecutionSafetyValues) => void;
};

export function ExecutionSafetyCard({ value, onChange }: ExecutionSafetyCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-3.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">Execution safety</h2>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500">
        These gates apply before Sigflo sends anything to your broker. You can keep live trading off while you learn
        the product.
      </p>
      <div className="mt-3 space-y-2">
        <ToggleRow
          label={value.allowLiveExecution ? 'Live execution enabled' : 'Live execution locked'}
          helper="When locked, Sigflo will not submit opening orders or TP/SL updates to the exchange. You can still review setups and paper flows."
          checked={value.allowLiveExecution}
          onChange={(allowLiveExecution) => onChange({ ...value, allowLiveExecution })}
        />
        <ToggleRow
          label="Require confirmation before orders"
          helper="Adds an explicit confirm step in trading flows (where supported)."
          checked={value.requireConfirmation}
          onChange={(requireConfirmation) => onChange({ ...value, requireConfirmation })}
        />
        <ToggleRow
          label="Paper mode by default"
          helper="Prefer paper-style review until you choose otherwise."
          checked={value.paperModeDefault}
          onChange={(paperModeDefault) => onChange({ ...value, paperModeDefault })}
        />
      </div>
    </section>
  );
}
