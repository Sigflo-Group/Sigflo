"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHART_OVERLAY_PRESET_LIVE_TRADE = exports.CHART_OVERLAY_PRESET_SETUP = exports.TRADE_CHART_LEVEL_COLORS = void 0;
exports.chartOverlayPresetSetupLevels = chartOverlayPresetSetupLevels;
exports.buildChartOverlayPresetLive = buildChartOverlayPresetLive;
/**
 * Shared trade level colors for chart + UI (live trade mode).
 * Entry: teal/cyan · Target: green · Stop: red · Trim: amber.
 */
exports.TRADE_CHART_LEVEL_COLORS = {
    entry: '#2dd4bf',
    target: '#4ade80',
    stop: '#f87171',
    liquidation: '#fbbf24',
    trim: '#f59e0b',
};
/** Preset id: pre-entry — overlay chips default off until the user opts in. */
exports.CHART_OVERLAY_PRESET_SETUP = 'setup';
/** Preset id: position open — core trade levels on by default (see `buildChartOverlayPresetLive`). */
exports.CHART_OVERLAY_PRESET_LIVE_TRADE = 'live_trade';
/** All trade overlay toggles off (setup / clean default). */
function chartOverlayPresetSetupLevels() {
    return {
        entry: false,
        stop: false,
        target: false,
        liquidation: false,
    };
}
/**
 * Live trade default visibility: entry, stop, target on; liquidation only when a valid price exists.
 * Trim / scale-out lines are driven separately via `auxiliaryPriceLines` on the chart card.
 */
function buildChartOverlayPresetLive(showLiquidationRow, liquidationPrice) {
    var liqOn = showLiquidationRow &&
        liquidationPrice != null &&
        Number.isFinite(liquidationPrice) &&
        liquidationPrice > 0;
    return {
        entry: true,
        stop: true,
        target: true,
        liquidation: liqOn,
    };
}
