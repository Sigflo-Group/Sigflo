"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHART_OVERLAY_PRESET_SETUP = exports.CHART_OVERLAY_PRESET_LIVE_TRADE = exports.chartOverlayPresetSetupLevels = exports.buildChartOverlayPresetLive = exports.TRADE_CHART_LEVEL_COLORS = void 0;
/**
 * Trade level visuals shared by the chart and future multi-position overlays.
 * Price-line sync lives in `PriceChartCard`; colors live in `tradeChartLevels`.
 */
var tradeChartLevels_1 = require("@/lib/tradeChartLevels");
Object.defineProperty(exports, "TRADE_CHART_LEVEL_COLORS", { enumerable: true, get: function () { return tradeChartLevels_1.TRADE_CHART_LEVEL_COLORS; } });
Object.defineProperty(exports, "buildChartOverlayPresetLive", { enumerable: true, get: function () { return tradeChartLevels_1.buildChartOverlayPresetLive; } });
Object.defineProperty(exports, "chartOverlayPresetSetupLevels", { enumerable: true, get: function () { return tradeChartLevels_1.chartOverlayPresetSetupLevels; } });
Object.defineProperty(exports, "CHART_OVERLAY_PRESET_LIVE_TRADE", { enumerable: true, get: function () { return tradeChartLevels_1.CHART_OVERLAY_PRESET_LIVE_TRADE; } });
Object.defineProperty(exports, "CHART_OVERLAY_PRESET_SETUP", { enumerable: true, get: function () { return tradeChartLevels_1.CHART_OVERLAY_PRESET_SETUP; } });
