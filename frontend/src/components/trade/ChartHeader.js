"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartHeader = ChartHeader;
var PriceChartCard_1 = require("@/components/trade/PriceChartCard");
var tradeChartHeights_1 = require("@/config/tradeChartHeights");
/**
 * Sticky trade chart block with a collapsible plot height driven by scroll on `.trade-scroll`.
 * Forwards interval, `setupMode`, and timing props into `PriceChartCard`.
 */
function ChartHeader(_a) {
    var collapsed = _a.collapsed, _b = _a.plotExpandedPx, plotExpandedPx = _b === void 0 ? tradeChartHeights_1.TRADE_CHART_PLOT_EXPANDED_PX : _b, _c = _a.plotCollapsedPx, plotCollapsedPx = _c === void 0 ? tradeChartHeights_1.TRADE_CHART_PLOT_COLLAPSED_PX : _c, _d = _a.chartWrapClassName, chartWrapClassName = _d === void 0 ? 'mx-auto w-full max-w-lg px-1.5' : _d, _e = _a.chartPlotFlexFill, chartPlotFlexFill = _e === void 0 ? false : _e, _f = _a.className, className = _f === void 0 ? '' : _f, chartProps = __rest(_a, ["collapsed", "plotExpandedPx", "plotCollapsedPx", "chartWrapClassName", "chartPlotFlexFill", "className"]);
    var plotH = collapsed ? plotCollapsedPx : plotExpandedPx;
    return (<div className={"w-full min-w-0 ".concat(chartPlotFlexFill ? 'flex min-h-0 min-w-0 flex-1 flex-col' : '', " ").concat(className)}>
      <div className={"min-w-0 ".concat(chartWrapClassName, " ").concat(chartPlotFlexFill ? 'flex min-h-0 min-w-0 flex-1 flex-col' : '')}>
        <PriceChartCard_1.PriceChartCard {...chartProps} chartPlotFlexFill={chartPlotFlexFill} chartPlotHeightPx={chartPlotFlexFill ? undefined : plotH} chartHeightPx={plotH}/>
      </div>
    </div>);
}
