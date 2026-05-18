"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketCard = MarketCard;
var react_1 = require("react");
var formatQuote_1 = require("@/lib/formatQuote");
var useTriggeredMotion_1 = require("@/hooks/useTriggeredMotion");
var signalState_1 = require("@/lib/signalState");
var TriggeredFireMark_1 = require("@/components/ui/TriggeredFireMark");
function buildMiniSeries(row) {
    var len = 20;
    var trendBias = (row.signal.scoreBreakdown.trendAlignment - 12) / 22;
    var momentumBias = (row.signal.scoreBreakdown.momentumQuality - 10) / 18;
    var setupBias = (row.setupScore - 60) / 120;
    var dailyBias = Math.max(-0.04, Math.min(0.04, row.change24hPct / 250));
    var sideBias = row.signal.side === 'long' ? 0.02 : -0.02;
    var slope = trendBias * 0.35 + momentumBias * 0.25 + setupBias * 0.25 + dailyBias * 0.15 + sideBias;
    var out = [];
    for (var i = 0; i < len; i += 1) {
        var t = i / (len - 1);
        var wobble = Math.sin((i + row.symbol.length) * 0.7) * 0.06 + Math.cos((i + row.setupScore) * 0.33) * 0.04;
        var v = 0.5 + slope * (t - 0.5) + wobble;
        out.push(Math.max(0.1, Math.min(0.9, v)));
    }
    return out;
}
function seriesFromCandles(candles, livePrice) {
    if (candles.length === 0)
        return [];
    var closes = candles.map(function (c) { return c.close; });
    // Blend live ticker into the latest point so mini charts move between candle closes.
    if (livePrice != null && Number.isFinite(livePrice) && closes.length > 0) {
        closes[closes.length - 1] = livePrice;
    }
    var min = Math.min.apply(Math, closes);
    var max = Math.max.apply(Math, closes);
    var span = Math.max(0.000001, max - min);
    return closes.map(function (v) { return Math.max(0.1, Math.min(0.9, (v - min) / span)); });
}
function sparkPath(series, w, h) {
    return series
        .map(function (v, i) {
        var x = (i / (series.length - 1)) * w;
        var y = h - v * h;
        return "".concat(i === 0 ? 'M' : 'L').concat(x.toFixed(2), ",").concat(y.toFixed(2));
    })
        .join(' ');
}
function MarketCard(_a) {
    var row = _a.row, onOpen = _a.onOpen, miniCandles = _a.miniCandles, _b = _a.isPrimaryTriggered, isPrimaryTriggered = _b === void 0 ? false : _b, _c = _a.isDimmed, isDimmed = _c === void 0 ? false : _c, _d = _a.isLocking, isLocking = _d === void 0 ? false : _d;
    var prevLivePriceRef = (0, react_1.useRef)(null);
    var _e = (0, react_1.useState)('flat'), tickDirection = _e[0], setTickDirection = _e[1];
    var _f = (0, react_1.useState)(function () { return Date.now(); }), nowMs = _f[0], setNowMs = _f[1];
    (0, react_1.useEffect)(function () {
        var id = window.setInterval(function () { return setNowMs(Date.now()); }, 1000);
        return function () { return window.clearInterval(id); };
    }, []);
    (0, react_1.useEffect)(function () {
        if (!Number.isFinite(row.lastPrice))
            return;
        var prev = prevLivePriceRef.current;
        if (prev != null) {
            if (row.lastPrice > prev)
                setTickDirection('up');
            else if (row.lastPrice < prev)
                setTickDirection('down');
            else
                setTickDirection('flat');
        }
        prevLivePriceRef.current = row.lastPrice;
    }, [row.lastPrice]);
    var uiState = (0, signalState_1.uiSignalStateFromMarketStatus)(row.status);
    var uiStateStyle = (0, signalState_1.uiSignalStateClasses)(uiState);
    var isTriggered = uiState === 'triggered';
    var triggeredAgeSec = row.triggeredAtMs != null && Number.isFinite(row.triggeredAtMs)
        ? Math.max(0, Math.floor((nowMs - row.triggeredAtMs) / 1000))
        : null;
    var showJustTriggered = isTriggered && isPrimaryTriggered && triggeredAgeSec != null && triggeredAgeSec <= 18;
    var justTriggered = (0, useTriggeredMotion_1.useTriggeredMotion)(isTriggered, 900);
    var hoverOutlineClass = isTriggered
        ? 'group-hover:ring-2 group-hover:ring-[rgba(0,255,200,0.45)] group-hover:border-[rgba(0,255,200,0.72)] active:ring-2 active:ring-[rgba(0,255,200,0.5)] active:border-[rgba(0,255,200,0.9)]'
        : uiState === 'in_play'
            ? 'group-hover:ring-2 group-hover:ring-cyan-400/22 group-hover:border-cyan-300/32'
            : 'group-hover:ring-2 group-hover:ring-slate-400/18 group-hover:border-slate-300/22';
    var changePositive = row.change24hPct >= 0;
    var chartW = 120;
    var chartH = 36;
    var candleWindow = miniCandles && miniCandles.length >= 8 ? miniCandles.slice(-28) : undefined;
    var candleWindowWithLive = candleWindow && candleWindow.length > 0
        ? __spreadArray(__spreadArray([], candleWindow.slice(0, -1), true), [__assign(__assign({}, candleWindow[candleWindow.length - 1]), { close: row.lastPrice })], false) : undefined;
    var series = candleWindow ? seriesFromCandles(candleWindow, row.lastPrice) : buildMiniSeries(row);
    var miniIsUp = (function () {
        // Prefer short trend direction so obvious moves don't get overridden by a single tick.
        if (candleWindowWithLive && candleWindowWithLive.length >= 6) {
            var last = candleWindowWithLive[candleWindowWithLive.length - 1].close;
            var lookback = candleWindowWithLive[candleWindowWithLive.length - 6].close;
            if (last !== lookback)
                return last > lookback;
        }
        if (series.length >= 6) {
            var last = series[series.length - 1];
            var lookback = series[series.length - 6];
            if (last !== lookback)
                return last > lookback;
        }
        if (tickDirection !== 'flat')
            return tickDirection === 'up';
        return true;
    })();
    var miniLineColor = miniIsUp ? '#34d399' : '#fb7185';
    var line = sparkPath(series, chartW, chartH);
    var area = "".concat(line, " L").concat(chartW, ",").concat(chartH, " L0,").concat(chartH, " Z");
    var _g = (0, react_1.useState)(false), pressed = _g[0], setPressed = _g[1];
    return (<button type="button" onClick={onOpen} onPointerDown={function () { return setPressed(true); }} onPointerUp={function () { return setPressed(false); }} onPointerLeave={function () { return setPressed(false); }} className="group w-full text-left" aria-label={"Open trade for ".concat(row.symbol)}>
      <div className={"rounded-xl border bg-sigflo-surface sigflo-panel-texture p-3 transition-all active:scale-[0.99] sm:rounded-2xl sm:p-3.5 ".concat(isTriggered
            ? "".concat(uiStateStyle.card, " sigflo-trigger-card-rest ").concat(justTriggered ? 'sigflo-trigger-card-just' : '', " ").concat(isPrimaryTriggered
                ? 'scale-[1.008] border-[rgba(0,255,200,0.88)] ring-2 ring-[rgba(0,255,200,0.46)] shadow-[0_14px_32px_-16px_rgba(0,255,200,0.72)]'
                : 'scale-[1.004]')
            : uiState === 'in_play'
                ? "".concat(uiStateStyle.card, " scale-[1.002]")
                : uiStateStyle.card, " ").concat(hoverOutlineClass, " ").concat(isDimmed ? 'opacity-45 blur-[0.6px] saturate-75' : '', " ").concat(isLocking ? 'scale-[1.01] shadow-[0_14px_30px_-16px_rgba(0,255,200,0.65)]' : '', " ").concat(pressed ? 'scale-[0.992] shadow-[0_0_16px_-6px_rgba(0,255,200,0.5)]' : '', " group-hover:shadow-[0_8px_20px_-18px_rgba(0,0,0,0.55)] active:shadow-[0_0_14px_-8px_rgba(0,255,200,0.45)]")}>
        <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
          {/* Left: pair + status */}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-2">
              <div className="min-w-0 flex items-center gap-1.5 sm:gap-1.5">
                {isTriggered ? <TriggeredFireMark_1.TriggeredFireMark hot={justTriggered || showJustTriggered}/> : null}
                <h3 className="max-w-[34vw] truncate text-[14px] font-bold tracking-tight text-white min-[380px]:max-w-[42vw] sm:max-w-none sm:text-[15px]">
                  {row.pair}
                </h3>
              </div>
              <span className={"min-w-0 inline-flex items-center gap-1.5 text-[10px] font-semibold sm:gap-1.5 sm:text-[10px] ".concat(uiStateStyle.text)}>
                <span className={"relative flex ".concat(isTriggered ? 'h-2 w-2' : 'h-1.5 w-1.5')}>
                  {uiStateStyle.pulse ? (<>
                      {justTriggered ? <span className="absolute inset-[-1px] rounded-full border border-[#7fffe0]/45 sigflo-trigger-dot-halo"/> : null}
                      <span className={"absolute inline-flex h-full w-full rounded-full ".concat(uiStateStyle.dot, " sigflo-trigger-dot ").concat(justTriggered ? 'sigflo-trigger-dot-just' : '')}/>
                    </>) : null}
                  <span className={"relative inline-flex h-full w-full rounded-full ".concat(uiStateStyle.dot)}/>
                </span>
                <span className={"max-w-[22vw] truncate min-[380px]:max-w-[28vw] sm:max-w-none ".concat(isTriggered ? 'uppercase tracking-[0.11em] text-[#b2ffef] drop-shadow-[0_0_8px_rgba(0,255,200,0.45)]' : '')}>
                  {showJustTriggered ? 'Just triggered' : (0, signalState_1.uiSignalStateLabel)(uiState)}
                </span>
              </span>
            </div>
            {isTriggered && !showJustTriggered ? (<p className={"pl-6 pt-0.5 text-[10px] font-semibold text-[#9fffe9]/90 sm:pl-16 sm:text-[10px] ".concat(justTriggered ? 'sigflo-trigger-entry-active sigflo-trigger-entry-shimmer' : '')}>
                Entry open
              </p>) : null}
          </div>

          {/* Middle: mini chart (between status and price) */}
          <div className="w-[86px] shrink-0 min-[380px]:w-[110px] sm:w-[122px]">
            <div className="overflow-hidden rounded-md border border-white/[0.05] bg-[#08090d] px-1 py-1 sm:rounded-md sm:px-1 sm:py-0.5">
              <svg viewBox={"0 0 ".concat(chartW, " ").concat(chartH)} className="h-[26px] w-full sm:h-[30px]" aria-hidden>
                <defs>
                  <linearGradient id={"market-area-".concat(row.symbol)} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={miniLineColor} stopOpacity="0.24"/>
                    <stop offset="100%" stopColor={miniLineColor} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d={area} fill={"url(#market-area-".concat(row.symbol, ")")}/>
                <path d={line} fill="none" stroke={miniLineColor} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Right: price + change */}
          <div className="w-[64px] shrink-0 text-right min-[380px]:w-[80px] sm:w-auto">
            <p className="text-[13px] font-bold tabular-nums text-white sm:text-[13px]">
              {Number.isFinite(row.lastPrice) ? "$".concat((0, formatQuote_1.formatQuoteNumber)(row.lastPrice)) : '—'}
            </p>
            <p className={"text-[11px] font-semibold tabular-nums sm:text-[11px] ".concat(changePositive ? 'text-emerald-400' : 'text-rose-400')}>
              {Number.isFinite(row.change24hPct) ? "".concat(changePositive ? '+' : '').concat(row.change24hPct.toFixed(2), "%") : '—'}
            </p>
            <p className={"mt-0.5 text-right text-[13px] font-bold transition-transform sm:text-[13px] ".concat(uiState === 'triggered'
            ? 'text-[#ddfff7] drop-shadow-[0_0_8px_rgba(0,255,200,0.55)]'
            : uiState === 'in_play'
                ? 'text-cyan-100'
                : 'text-sigflo-muted/95', " ").concat(pressed ? 'translate-x-1' : '', " group-hover:translate-x-0.5 group-hover:brightness-125 group-active:translate-x-1")} aria-hidden>
              →
            </p>
          </div>
        </div>
      </div>
    </button>);
}
