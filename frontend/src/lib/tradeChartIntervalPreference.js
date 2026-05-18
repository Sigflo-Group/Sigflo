"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGFLO_CHART_INTERVAL_EVENT = exports.TRADE_CHART_INTERVAL_STORAGE_KEY = void 0;
exports.parseTradeChartInterval = parseTradeChartInterval;
exports.readPersistedTradeChartInterval = readPersistedTradeChartInterval;
exports.tradeChartIntervalShortLabel = tradeChartIntervalShortLabel;
/** Same key as `TradeScreen` — feed / markets mini charts read this to match the trade chart. */
exports.TRADE_CHART_INTERVAL_STORAGE_KEY = 'sigflo.trade.chartInterval';
var VALID = new Set(['1', '5', '15', '60', '240', 'D', 'W']);
function parseTradeChartInterval(raw) {
    if (raw && VALID.has(raw))
        return raw;
    return null;
}
function readPersistedTradeChartInterval() {
    var _a;
    if (typeof localStorage === 'undefined')
        return '5';
    return (_a = parseTradeChartInterval(localStorage.getItem(exports.TRADE_CHART_INTERVAL_STORAGE_KEY))) !== null && _a !== void 0 ? _a : '5';
}
/** Short label next to feed mini charts — aligned with `TradeScreen` interval chips. */
function tradeChartIntervalShortLabel(i) {
    if (i === 'D')
        return '1D';
    if (i === 'W')
        return '1W';
    if (i === '60')
        return '1h';
    if (i === '240')
        return '4h';
    if (i === '1')
        return '1m';
    return "".concat(i, "m");
}
exports.SIGFLO_CHART_INTERVAL_EVENT = 'sigflo-chart-interval';
