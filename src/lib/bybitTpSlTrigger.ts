/** Bybit v5 `tpTriggerBy` / `slTriggerBy` for full-position TP/SL (order create + position trading-stop). */
export const BYBIT_TPSL_TRIGGER_VALUES = ['MarkPrice', 'LastPrice', 'IndexPrice'] as const;
export type BybitTpSlTriggerBy = (typeof BYBIT_TPSL_TRIGGER_VALUES)[number];

/** Default: mark — typical perp SL trigger (fair price), similar to MEXC “Fair”. */
export const DEFAULT_BYBIT_TPSL_TRIGGER: BybitTpSlTriggerBy = 'MarkPrice';

export function bybitTpSlTriggerShortLabel(t: BybitTpSlTriggerBy): string {
  if (t === 'MarkPrice') return 'Mark';
  if (t === 'LastPrice') return 'Last';
  return 'Index';
}
