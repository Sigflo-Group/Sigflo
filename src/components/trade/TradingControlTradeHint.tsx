import { useTradingControlMode } from '@/context/TradingControlModeContext';
import { TRADING_AUTO_EXECUTION_ACTIVE } from '@/lib/tradingControlMode';

/** Compact workspace reminder of global AI control level (set on Bots). */
export function TradingControlTradeHint() {
  const { mode, meta } = useTradingControlMode();
  const autoPreview = mode === 'auto' && !TRADING_AUTO_EXECUTION_ACTIVE;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
      <p className="text-[10px] leading-snug text-sigflo-muted">
        <span className="font-semibold text-cyan-200/90">{meta.shortLabel} mode</span>
        <span className="text-sigflo-muted/80"> · </span>
        {meta.tradeHint}
        {autoPreview ? (
          <span className="text-amber-200/85"> · Automation preview only.</span>
        ) : null}
      </p>
    </div>
  );
}
