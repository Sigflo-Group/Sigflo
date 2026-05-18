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
exports.TradeChartPanel = TradeChartPanel;
var ChartHeader_1 = require("@/components/trade/ChartHeader");
var LiveMarketStrip_1 = require("@/components/trade/LiveMarketStrip");
/**
 * Chart region for trade screen: optional live strip + collapsible chart header.
 */
function TradeChartPanel(_a) {
    var liveStrip = _a.liveStrip, _b = _a.className, className = _b === void 0 ? '' : _b, chartProps = __rest(_a, ["liveStrip", "className"]);
    return (<div className={"flex min-h-0 w-full min-w-0 flex-col space-y-0 ".concat(className)}>
      {liveStrip ? <LiveMarketStrip_1.LiveMarketStrip {...liveStrip}/> : null}
      <ChartHeader_1.ChartHeader {...chartProps}/>
    </div>);
}
