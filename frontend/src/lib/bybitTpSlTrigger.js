"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BYBIT_TPSL_TRIGGER = exports.BYBIT_TPSL_TRIGGER_VALUES = void 0;
exports.bybitTpSlTriggerShortLabel = bybitTpSlTriggerShortLabel;
/** Bybit v5 `tpTriggerBy` / `slTriggerBy` for full-position TP/SL (order create + position trading-stop). */
exports.BYBIT_TPSL_TRIGGER_VALUES = ['MarkPrice'];
/** Default: mark — typical perp SL trigger (fair price), similar to MEXC “Fair”. */
exports.DEFAULT_BYBIT_TPSL_TRIGGER = 'MarkPrice';
function bybitTpSlTriggerShortLabel(t) {
    return t === 'MarkPrice' ? 'Mark' : 'Mark';
}
