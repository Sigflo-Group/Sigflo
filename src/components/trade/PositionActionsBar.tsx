export type DockManageAdjustButtonsProps = {
  disabled?: boolean;
  onManagePosition?: () => void;
  onReverseOrder?: () => void;
  onAdjustRisk?: () => void;
  className?: string;
};

/** Dock-only: one row — Manage position | Adjust risk | Reverse order. */
const dockManageBtnClass =
  'flex min-h-[28px] w-full items-center justify-center rounded-lg border border-cyan-400/28 bg-cyan-500/[0.07] px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-cyan-100/90 transition hover:border-cyan-200/55 hover:bg-cyan-500/18 hover:text-cyan-50 hover:shadow-[0_0_14px_-5px_rgba(34,211,238,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[30px] sm:text-[10px]';
const dockReverseBtnClass =
  'flex min-h-[28px] w-full items-center justify-center rounded-lg border border-amber-300/30 bg-amber-500/10 px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-100/90 transition hover:border-amber-200/65 hover:bg-amber-500/22 hover:text-amber-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[30px] sm:text-[10px]';
const dockAdjustBtnClass =
  'flex min-h-[28px] w-full items-center justify-center rounded-lg border border-landing-accent/30 bg-landing-accent-dim/35 px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-landing-accent-hi transition hover:bg-landing-accent-dim/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[30px] sm:text-[10px]';

export function DockManageAdjustButtons({
  disabled = false,
  onManagePosition,
  onReverseOrder,
  onAdjustRisk,
  className = '',
}: DockManageAdjustButtonsProps) {
  if (!onManagePosition && !onReverseOrder && !onAdjustRisk) return null;

  return (
    <div className={`grid min-w-0 w-full grid-cols-3 gap-1 ${className}`} role="group" aria-label="Position and risk">
      <div className="min-w-0">
        {onManagePosition ? (
          <button type="button" disabled={disabled} onClick={onManagePosition} className={dockManageBtnClass}>
            Manage position
          </button>
        ) : (
          <div className="min-h-[28px] min-w-0 sm:min-h-[30px]" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        {onAdjustRisk ? (
          <button type="button" disabled={disabled} onClick={onAdjustRisk} className={dockAdjustBtnClass}>
            Adjust risk
          </button>
        ) : (
          <div className="min-h-[28px] min-w-0 sm:min-h-[30px]" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        {onReverseOrder ? (
          <button type="button" disabled={disabled} onClick={onReverseOrder} className={dockReverseBtnClass}>
            Reverse order
          </button>
        ) : (
          <div className="min-h-[28px] min-w-0 sm:min-h-[30px]" aria-hidden />
        )}
      </div>
    </div>
  );
}
