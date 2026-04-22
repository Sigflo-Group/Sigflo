/** Bybit v5 `tpTriggerBy` / `slTriggerBy` for full-position TP/SL (order create + position trading-stop). */
export const BYBIT_TPSL_TRIGGER_VALUES = ['MarkPrice'] as const;
export type BybitTpSlTriggerBy = (typeof BYBIT_TPSL_TRIGGER_VALUES)[number];

/** Default: mark — typical perp SL trigger (fair price), similar to MEXC “Fair”. */
export const DEFAULT_BYBIT_TPSL_TRIGGER: BybitTpSlTriggerBy = 'MarkPrice';

export function bybitTpSlTriggerShortLabel(t: BybitTpSlTriggerBy): string {
  return t === 'MarkPrice' ? 'Mark' : 'Mark';
}
