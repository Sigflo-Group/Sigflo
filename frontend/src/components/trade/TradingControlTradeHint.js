"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingControlTradeHint = TradingControlTradeHint;
var react_router_dom_1 = require("react-router-dom");
var TradingControlModeContext_1 = require("@/context/TradingControlModeContext");
var tradingControlMode_1 = require("@/lib/tradingControlMode");
/** Compact workspace reminder of global AI control level (set on Bots). */
function TradingControlTradeHint() {
    var _a = (0, TradingControlModeContext_1.useTradingControlMode)(), mode = _a.mode, meta = _a.meta;
    var autoPreview = mode === 'auto' && !tradingControlMode_1.TRADING_AUTO_EXECUTION_ACTIVE;
    return (<div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
      <p className="text-[10px] leading-snug text-sigflo-muted">
        <span className="font-semibold text-cyan-200/90">{meta.shortLabel} mode</span>
        <span className="text-sigflo-muted/80"> · </span>
        {meta.tradeHint}
        {autoPreview ? (<span className="text-amber-200/85"> · Automation preview only.</span>) : null}
      </p>
      <p className="mt-1 text-[9px] leading-snug text-sigflo-muted/70">
        Change mode on{' '}
        <react_router_dom_1.Link to="/bots" className="font-semibold text-[#7ee8d3] underline-offset-2 hover:underline">
          Bots
        </react_router_dom_1.Link>
        .
      </p>
    </div>);
}
