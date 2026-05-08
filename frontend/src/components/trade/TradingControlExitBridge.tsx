import { useTradingControlMode } from '@/context/TradingControlModeContext';

/** Links global workspace mode (Bots) to the separate per-chart exit automation block. */
export function TradingControlExitBridge() {
  const { mode, meta } = useTradingControlMode();
  if (mode === 'suggestion') return null;
  return (
    <p className="mt-1 px-0.5 text-[9px] leading-snug text-sigflo-muted/85">
      <span className="font-semibold text-cyan-200/75">{meta.shortLabel} workspace</span>
      {' — '}
      Exit automation below is independent: use it for guided trims, stops, and scaling when you want AI help on this
      chart.
    </p>
  );
}
