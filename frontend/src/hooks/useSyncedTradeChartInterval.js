"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSyncedTradeChartInterval = useSyncedTradeChartInterval;
var react_1 = require("react");
var tradeChartIntervalPreference_1 = require("@/lib/tradeChartIntervalPreference");
/**
 * Trade chart interval from localStorage, updated when the user changes TF on Trade
 * (custom event) or from another tab (`storage`).
 */
function useSyncedTradeChartInterval() {
    var _a = (0, react_1.useState)(tradeChartIntervalPreference_1.readPersistedTradeChartInterval), interval = _a[0], setInterval = _a[1];
    (0, react_1.useEffect)(function () {
        var onStorage = function (e) {
            if (e.key !== tradeChartIntervalPreference_1.TRADE_CHART_INTERVAL_STORAGE_KEY)
                return;
            var next = (0, tradeChartIntervalPreference_1.parseTradeChartInterval)(e.newValue);
            if (next)
                setInterval(next);
        };
        var onSigflo = function (e) {
            var ce = e;
            var next = (0, tradeChartIntervalPreference_1.parseTradeChartInterval)(ce.detail);
            if (next)
                setInterval(next);
        };
        window.addEventListener('storage', onStorage);
        window.addEventListener(tradeChartIntervalPreference_1.SIGFLO_CHART_INTERVAL_EVENT, onSigflo);
        return function () {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(tradeChartIntervalPreference_1.SIGFLO_CHART_INTERVAL_EVENT, onSigflo);
        };
    }, []);
    return interval;
}
