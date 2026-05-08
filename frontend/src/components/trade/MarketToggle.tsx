import type { MarketMode } from '@/types/trade';

export function MarketToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: MarketMode;
  onChange: (m: MarketMode) => void;
  disabled?: boolean;
}) {
  const options: { id: MarketMode; label: string }[] = [
    { id: 'futures', label: 'Futures' },
    { id: 'spot', label: 'Spot' },
  ];
  return (
    <div className={`flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5 ${disabled ? 'opacity-50' : ''}`} role="tablist">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onChange(opt.id);
            }}
            className={`flex-1 rounded-lg py-1.5 text-[13px] font-semibold leading-none transition sm:text-sm ${
              active ? 'bg-sigflo-accent/12 text-sigflo-accent ring-1 ring-sigflo-accent/25' : 'text-sigflo-muted hover:text-sigflo-text'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
