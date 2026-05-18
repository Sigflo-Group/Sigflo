"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.TradeMiniChart = TradeMiniChart;
var react_1 = require("react");
var lightweight_charts_1 = require("lightweight-charts");
var chartSeriesOverlayCoordinates_1 = require("@/lib/chartSeriesOverlayCoordinates");
var marketDataService_1 = require("@/services/market/marketDataService");
var CHART_HEIGHT = 168;
var COL_ENTRY = 'rgba(0, 255, 200, 0.42)';
var COL_STOP = 'rgba(220, 90, 90, 0.82)';
var COL_TARGET = 'rgba(0, 230, 200, 0.52)';
var COL_LIQ = 'rgba(148, 163, 184, 0.32)';
function toTime(ts) {
    return Math.floor(ts / 1000);
}
function numFromBarPrice(p) {
    var n = typeof p === 'number' ? p : Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
}
function fmtDragPx(n) {
    if (!Number.isFinite(n))
        return '—';
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}
function buildSyntheticCandles(count, anchor, intervalMs) {
    var out = [];
    var now = Date.now();
    var px = anchor;
    for (var i = count - 1; i >= 0; i--) {
        var ts = now - i * intervalMs;
        var wobble = Math.sin(i * 0.21) * anchor * 0.0015 + ((i % 7) - 3) * anchor * 0.00025;
        var o = px;
        var c = o + wobble;
        var h = Math.max(o, c) + anchor * 0.0008;
        var l = Math.min(o, c) - anchor * 0.0008;
        out.push({ ts: ts, open: o, high: h, low: l, close: c, volume: 1 });
        px = c;
    }
    return out;
}
function TradeMiniChart(_a) {
    var _this = this;
    var pair = _a.pair, entryPrice = _a.entryPrice, stopPrice = _a.stopPrice, targets = _a.targets, direction = _a.direction, liquidationPrice = _a.liquidationPrice, interactiveLevels = _a.interactiveLevels, onPlannedStopChange = _a.onPlannedStopChange, onPlannedTargetsChange = _a.onPlannedTargetsChange, onLevelsDragEnd = _a.onLevelsDragEnd, planGeometryWarning = _a.planGeometryWarning;
    var hostRef = (0, react_1.useRef)(null);
    var chartRef = (0, react_1.useRef)(null);
    var seriesRef = (0, react_1.useRef)(null);
    var lineDisposersRef = (0, react_1.useRef)([]);
    var levelsRef = (0, react_1.useRef)({
        entryPrice: entryPrice,
        stopPrice: stopPrice,
        targets: targets !== null && targets !== void 0 ? targets : [],
        liquidationPrice: liquidationPrice,
    });
    levelsRef.current = {
        entryPrice: entryPrice,
        stopPrice: stopPrice,
        targets: targets !== null && targets !== void 0 ? targets : [],
        liquidationPrice: liquidationPrice,
    };
    var _b = (0, react_1.useState)(0), chartGen = _b[0], setChartGen = _b[1];
    var _c = (0, react_1.useState)(0), coordTick = _c[0], setCoordTick = _c[1];
    var _d = (0, react_1.useState)(null), floatLabel = _d[0], setFloatLabel = _d[1];
    var dragKindRef = (0, react_1.useRef)(null);
    var clearPriceLines = (0, react_1.useCallback)(function () {
        var series = seriesRef.current;
        for (var _i = 0, _a = lineDisposersRef.current; _i < _a.length; _i++) {
            var fn = _a[_i];
            try {
                fn();
            }
            catch (_b) {
                /* ignore */
            }
        }
        lineDisposersRef.current = [];
        void series;
    }, []);
    var applyPriceLines = (0, react_1.useCallback)(function () {
        var series = seriesRef.current;
        if (!series)
            return;
        clearPriceLines();
        var pushLine = function (ln) {
            lineDisposersRef.current.push(function () {
                try {
                    series.removePriceLine(ln);
                }
                catch (_a) {
                    /* ignore */
                }
            });
        };
        var _a = levelsRef.current, ent = _a.entryPrice, stp = _a.stopPrice, tg = _a.targets, liq = _a.liquidationPrice;
        if (ent != null && Number.isFinite(ent) && ent > 0) {
            var ln = series.createPriceLine({
                price: ent,
                color: COL_ENTRY,
                lineWidth: 1,
                lineStyle: lightweight_charts_1.LineStyle.Solid,
                axisLabelVisible: true,
                title: 'Entry',
            });
            pushLine(ln);
        }
        if (stp != null && Number.isFinite(stp) && stp > 0) {
            var ln = series.createPriceLine({
                price: stp,
                color: COL_STOP,
                lineWidth: 1,
                lineStyle: lightweight_charts_1.LineStyle.Solid,
                axisLabelVisible: true,
                title: 'Stop',
            });
            pushLine(ln);
        }
        for (var i = 0; i < tg.length; i++) {
            var t = tg[i];
            if (!Number.isFinite(t) || t <= 0)
                continue;
            var ln = series.createPriceLine({
                price: t,
                color: COL_TARGET,
                lineWidth: 1,
                lineStyle: lightweight_charts_1.LineStyle.Dashed,
                axisLabelVisible: true,
                title: "T".concat(i + 1),
            });
            pushLine(ln);
        }
        if (liq != null && Number.isFinite(liq) && liq > 0) {
            var ln = series.createPriceLine({
                price: liq,
                color: COL_LIQ,
                lineWidth: 1,
                lineStyle: lightweight_charts_1.LineStyle.Dotted,
                axisLabelVisible: true,
                title: 'Liq',
            });
            pushLine(ln);
        }
        setCoordTick(function (n) { return n + 1; });
    }, [clearPriceLines]);
    (0, react_1.useEffect)(function () {
        var host = hostRef.current;
        if (!host)
            return;
        var cancelled = false;
        var chart = (0, lightweight_charts_1.createChart)(host, {
            width: host.clientWidth || 320,
            height: CHART_HEIGHT,
            layout: {
                background: { type: lightweight_charts_1.ColorType.Solid, color: 'rgba(0,0,0,0)' },
                textColor: 'rgba(161,161,170,0.75)',
                fontSize: 10,
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.02)' },
                horzLines: { color: 'rgba(255,255,255,0.04)' },
            },
            crosshair: { mode: lightweight_charts_1.CrosshairMode.Hidden },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.12, bottom: 0.06 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 2,
            },
            handleScroll: false,
            handleScale: false,
        });
        var series = chart.addSeries(lightweight_charts_1.CandlestickSeries, {
            upColor: 'rgba(52,211,153,0.85)',
            downColor: 'rgba(248,113,113,0.85)',
            borderUpColor: 'rgba(52,211,153,0.85)',
            borderDownColor: 'rgba(248,113,113,0.85)',
            wickUpColor: 'rgba(52,211,153,0.55)',
            wickDownColor: 'rgba(248,113,113,0.55)',
            lastValueVisible: false,
            priceLineVisible: false,
        });
        chartRef.current = chart;
        seriesRef.current = series;
        var load = function () { return __awaiter(_this, void 0, void 0, function () {
            var candles, lv, anchor, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, marketDataService_1.getKlines)(pair, '15m', 50)];
                    case 1:
                        candles = _a.sent();
                        if (cancelled)
                            return [2 /*return*/];
                        lv = levelsRef.current;
                        if (!candles.length) {
                            anchor = lv.entryPrice && Number.isFinite(lv.entryPrice) && lv.entryPrice > 0
                                ? lv.entryPrice
                                : lv.stopPrice && Number.isFinite(lv.stopPrice) && lv.stopPrice > 0
                                    ? lv.stopPrice * 1.002
                                    : 50000;
                            candles = buildSyntheticCandles(50, anchor, 15 * 60 * 1000);
                        }
                        if (cancelled)
                            return [2 /*return*/];
                        data = candles.map(function (c) { return ({
                            time: toTime(c.ts),
                            open: c.open,
                            high: c.high,
                            low: c.low,
                            close: c.close,
                        }); });
                        series.setData(data);
                        applyPriceLines();
                        chart.timeScale().fitContent();
                        setChartGen(function (g) { return g + 1; });
                        return [2 /*return*/];
                }
            });
        }); };
        void load();
        var bumpCoords = function () { return setCoordTick(function (n) { return n + 1; }); };
        var ts = chart.timeScale();
        ts.subscribeVisibleLogicalRangeChange(bumpCoords);
        var ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(function () {
                if (!hostRef.current || !chartRef.current)
                    return;
                var w = hostRef.current.clientWidth;
                if (w > 0)
                    chartRef.current.applyOptions({ width: w, height: CHART_HEIGHT });
                bumpCoords();
            })
            : null;
        ro === null || ro === void 0 ? void 0 : ro.observe(host);
        return function () {
            cancelled = true;
            ts.unsubscribeVisibleLogicalRangeChange(bumpCoords);
            ro === null || ro === void 0 ? void 0 : ro.disconnect();
            clearPriceLines();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [pair, applyPriceLines, clearPriceLines]);
    (0, react_1.useEffect)(function () {
        if (!seriesRef.current)
            return;
        applyPriceLines();
    }, [applyPriceLines, entryPrice, stopPrice, targets === null || targets === void 0 ? void 0 : targets.join(','), liquidationPrice, chartGen]);
    void coordTick;
    var onOverlayPointerDown = function (e) {
        if (!interactiveLevels)
            return;
        var series = seriesRef.current;
        var host = hostRef.current;
        if (!series || !host)
            return;
        if (!onPlannedStopChange && !onPlannedTargetsChange)
            return;
        var yPane = (0, chartSeriesOverlayCoordinates_1.clientYToSeriesCoordinateY)(series, e.clientY);
        if (yPane == null)
            return;
        var hit = 12;
        var stp = stopPrice;
        if (stp != null && Number.isFinite(stp) && stp > 0 && onPlannedStopChange) {
            var ys = series.priceToCoordinate(stp);
            var yn = ys != null ? Number(ys) : NaN;
            if (Number.isFinite(yn) && Math.abs(yPane - yn) <= hit) {
                dragKindRef.current = 'stop';
                e.currentTarget.setPointerCapture(e.pointerId);
                setFloatLabel(fmtDragPx(stp));
                return;
            }
        }
        var tg = targets !== null && targets !== void 0 ? targets : [];
        if (onPlannedTargetsChange) {
            for (var i = 0; i < tg.length; i++) {
                var t = tg[i];
                if (!Number.isFinite(t) || t <= 0)
                    continue;
                var yt = series.priceToCoordinate(t);
                var ytn = yt != null ? Number(yt) : NaN;
                if (Number.isFinite(ytn) && Math.abs(yPane - ytn) <= hit) {
                    dragKindRef.current = i;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setFloatLabel(fmtDragPx(t));
                    return;
                }
            }
        }
    };
    var onOverlayPointerMove = function (e) {
        var kind = dragKindRef.current;
        if (kind === null)
            return;
        var series = seriesRef.current;
        if (!series)
            return;
        var yPane = (0, chartSeriesOverlayCoordinates_1.clientYToSeriesCoordinateY)(series, e.clientY);
        if (yPane == null)
            return;
        var raw = series.coordinateToPrice(yPane);
        var price = numFromBarPrice(raw);
        if (price == null)
            return;
        setFloatLabel(fmtDragPx(price));
        if (kind === 'stop') {
            onPlannedStopChange === null || onPlannedStopChange === void 0 ? void 0 : onPlannedStopChange(price);
        }
        else if (typeof kind === 'number' && onPlannedTargetsChange) {
            var next = __spreadArray([], (targets !== null && targets !== void 0 ? targets : []), true);
            if (kind >= 0 && kind < next.length) {
                next[kind] = price;
                onPlannedTargetsChange(next);
            }
        }
    };
    var endDrag = function (e) {
        if (dragKindRef.current === null)
            return;
        dragKindRef.current = null;
        setFloatLabel(null);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        catch (_a) {
            /* ignore */
        }
        onLevelsDragEnd === null || onLevelsDragEnd === void 0 ? void 0 : onLevelsDragEnd();
    };
    return (<div className="w-full">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">15m · last 50 bars</p>
      <div className={"relative overflow-hidden rounded-xl border bg-[#050505]/40 ".concat(planGeometryWarning ? 'border-amber-500/35 ring-1 ring-amber-500/25' : 'border-white/[0.08]')}>
        {floatLabel ? (<div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-md border border-white/15 bg-black/75 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-100 shadow-lg backdrop-blur-sm" aria-live="polite">
            {floatLabel}
          </div>) : null}
        <div ref={hostRef} className="h-[168px] w-full" aria-label={"Mini price chart for ".concat(pair, ", ").concat(direction === 'LONG' ? 'long' : 'short', " setup")}/>
        {interactiveLevels && chartGen > 0 ? (<div className="absolute inset-0 z-10 h-[168px] cursor-ns-resize touch-none" onPointerDown={onOverlayPointerDown} onPointerMove={onOverlayPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} aria-hidden/>) : null}
      </div>
    </div>);
}
