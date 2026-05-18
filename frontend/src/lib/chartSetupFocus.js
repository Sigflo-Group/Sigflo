"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHART_SETUP_FOCUS_EVENT = void 0;
exports.requestChartSetupFocus = requestChartSetupFocus;
/** Dispatched on `window` so any mounted `PriceChartCard` can react without prop drilling. */
exports.CHART_SETUP_FOCUS_EVENT = 'sigflo-chart-setup-focus';
function requestChartSetupFocus(detail) {
    if (detail === void 0) { detail = {}; }
    try {
        window.dispatchEvent(new CustomEvent(exports.CHART_SETUP_FOCUS_EVENT, { detail: detail }));
    }
    catch (_a) {
        /* ignore */
    }
}
