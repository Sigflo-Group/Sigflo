"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradePlanDragHandles = TradePlanDragHandles;
var react_1 = require("react");
var chartSeriesOverlayCoordinates_1 = require("@/lib/chartSeriesOverlayCoordinates");
var PRICE_SCALE_GUTTER_FALLBACK_PX = 72;
var PRICE_SCALE_GUTTER_PAD_PX = 6;
var HIT_STRIP_PX = 14;
function numFromBarPrice(p) {
    var n = typeof p === 'number' ? p : Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
}
function fmtDragPx(n) {
    if (!Number.isFinite(n))
        return '—';
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}
/**
 * Thin horizontal hit strips over stop / target (Setup + premium zones). Does not cover the full plot so
 * Lightweight Charts pan/zoom still works outside those levels.
 */
function TradePlanDragHandles(_a) {
    var plotEl = _a.plotEl, chartRef = _a.chartRef, candleSeriesRef = _a.candleSeriesRef, lineSeriesRef = _a.lineSeriesRef, candlesActive = _a.candlesActive, chartGen = _a.chartGen, stop = _a.stop, target = _a.target, visibleStop = _a.visibleStop, visibleTarget = _a.visibleTarget, onStopChange = _a.onStopChange, onTargetChange = _a.onTargetChange, onStopDragEnd = _a.onStopDragEnd, onTargetDragEnd = _a.onTargetDragEnd;
    var _b = (0, react_1.useState)(0), coordTick = _b[0], setCoordTick = _b[1];
    var _c = (0, react_1.useState)(null), floatLabel = _c[0], setFloatLabel = _c[1];
    var dragKindRef = (0, react_1.useRef)(null);
    var lastDragPriceRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (!plotEl)
            return;
        var chart = chartRef.current;
        if (!chart)
            return;
        var bump = function () { return setCoordTick(function (n) { return n + 1; }); };
        var ts = chart.timeScale();
        ts.subscribeVisibleLogicalRangeChange(bump);
        var ro = new ResizeObserver(function () { return bump(); });
        ro.observe(plotEl);
        var ps = chart.priceScale('right');
        if (typeof ps.subscribeVisiblePriceRangeChange === 'function') {
            ps.subscribeVisiblePriceRangeChange(bump);
        }
        var id = window.setInterval(bump, 500);
        return function () {
            ts.unsubscribeVisibleLogicalRangeChange(bump);
            ro.disconnect();
            if (typeof ps.unsubscribeVisiblePriceRangeChange === 'function') {
                ps.unsubscribeVisiblePriceRangeChange(bump);
            }
            window.clearInterval(id);
        };
    }, [chartRef, plotEl, chartGen]);
    void coordTick;
    var chart = chartRef.current;
    var series = candlesActive ? candleSeriesRef.current : lineSeriesRef.current;
    if (!plotEl || !chart || !series)
        return null;
    var measuredScaleW = chart.priceScale('right').width();
    var rightGutterPx = measuredScaleW > 0
        ? Math.min(140, Math.ceil(measuredScaleW + PRICE_SCALE_GUTTER_PAD_PX))
        : PRICE_SCALE_GUTTER_FALLBACK_PX;
    var H = plotEl.clientHeight;
    var W = plotEl.clientWidth;
    if (H < 8 || W < 8)
        return null;
    var yStop = visibleStop && Number.isFinite(stop) && stop > 0 ? (0, chartSeriesOverlayCoordinates_1.seriesPriceToOverlayY)(plotEl, series, stop) : null;
    var yTgt = visibleTarget && Number.isFinite(target) && target > 0 ? (0, chartSeriesOverlayCoordinates_1.seriesPriceToOverlayY)(plotEl, series, target) : null;
    var beginStripDrag = function (e, kind, labelPrice) {
        dragKindRef.current = kind;
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        lastDragPriceRef.current = labelPrice;
        setFloatLabel(fmtDragPx(labelPrice));
    };
    var onStripMove = function (e) {
        var kind = dragKindRef.current;
        if (kind == null)
            return;
        e.stopPropagation();
        var y = (0, chartSeriesOverlayCoordinates_1.clientYToSeriesCoordinateY)(series, e.clientY);
        if (y == null)
            return;
        var raw = series.coordinateToPrice(y);
        var price = numFromBarPrice(raw);
        if (price == null)
            return;
        lastDragPriceRef.current = price;
        setFloatLabel(fmtDragPx(price));
        if (kind === 'stop')
            onStopChange === null || onStopChange === void 0 ? void 0 : onStopChange(price);
        else
            onTargetChange === null || onTargetChange === void 0 ? void 0 : onTargetChange(price);
    };
    var endStripDrag = function (e) {
        if (dragKindRef.current == null)
            return;
        var kind = dragKindRef.current;
        var last = lastDragPriceRef.current;
        dragKindRef.current = null;
        lastDragPriceRef.current = null;
        setFloatLabel(null);
        var cancelled = e.type === 'pointercancel';
        if (!cancelled) {
            if (kind === 'stop' && last != null)
                onStopDragEnd === null || onStopDragEnd === void 0 ? void 0 : onStopDragEnd(last);
            if (kind === 'target' && last != null)
                onTargetDragEnd === null || onTargetDragEnd === void 0 ? void 0 : onTargetDragEnd(last);
        }
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        catch (_a) {
            /* ignore */
        }
    };
    var stripWrapClass = 'pointer-events-auto absolute left-0 z-[40] cursor-ns-resize touch-none';
    return (<>
      {floatLabel ? (<div className="pointer-events-none absolute left-1/2 top-3 z-[45] -translate-x-1/2 rounded-md border border-white/15 bg-black/80 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-100 shadow-lg backdrop-blur-sm" aria-live="polite">
          {floatLabel}
        </div>) : null}
      {yStop != null && (onStopChange || onStopDragEnd) ? (<div aria-label="Drag to adjust stop price" className={stripWrapClass} style={{
                top: yStop - HIT_STRIP_PX / 2,
                height: HIT_STRIP_PX,
                right: rightGutterPx,
            }} onPointerDown={function (e) { return beginStripDrag(e, 'stop', stop); }} onPointerMove={onStripMove} onPointerUp={endStripDrag} onPointerCancel={endStripDrag}/>) : null}
      {yTgt != null && (onTargetChange || onTargetDragEnd) ? (<div aria-label="Drag to adjust target price" className={stripWrapClass} style={{
                top: yTgt - HIT_STRIP_PX / 2,
                height: HIT_STRIP_PX,
                right: rightGutterPx,
            }} onPointerDown={function (e) { return beginStripDrag(e, 'target', target); }} onPointerMove={onStripMove} onPointerUp={endStripDrag} onPointerCancel={endStripDrag}/>) : null}
    </>);
}
