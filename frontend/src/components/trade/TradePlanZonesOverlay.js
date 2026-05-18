"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradePlanZonesOverlay = TradePlanZonesOverlay;
var react_1 = require("react");
var TradePlanCornerStats_1 = require("@/components/trade/TradePlanCornerStats");
var chartSeriesOverlayCoordinates_1 = require("@/lib/chartSeriesOverlayCoordinates");
var tradePlanOverlayGeometry_1 = require("@/lib/tradePlanOverlayGeometry");
/**
 * Fallback when `priceScale('right').width()` is not ready yet (0). Prefer live measurement so overlays align with
 * the real candle pane — a fixed gutter was often too wide and lines/zones stopped short of the latest bars.
 */
var PRICE_SCALE_GUTTER_FALLBACK_PX = 72;
/** Breathing room past measured axis width so we do not clip the last-price line / labels. */
var PRICE_SCALE_GUTTER_PAD_PX = 6;
/** Small gap between the Stop/Tgt chip and the price scale (plot is already inset by `rightGutterPx`). */
var CORNER_STATS_RIGHT_GAP_PX = 6;
function priceToY(series, plotEl, price) {
    if (!series)
        return null;
    return (0, chartSeriesOverlayCoordinates_1.seriesPriceToOverlayY)(plotEl, series, price);
}
function ySpan(yA, yB) {
    var top = Math.min(yA, yB);
    var height = Math.max(1, Math.abs(yB - yA));
    return { top: top, height: height };
}
function TradePlanZonesOverlay(_a) {
    var plotEl = _a.plotEl, chartRef = _a.chartRef, candleSeriesRef = _a.candleSeriesRef, lineSeriesRef = _a.lineSeriesRef, candlesActive = _a.candlesActive, side = _a.side, entry = _a.entry, stop = _a.stop, target = _a.target, lastPrice = _a.lastPrice, riskReward = _a.riskReward, visibleEntry = _a.visibleEntry, visibleStop = _a.visibleStop, visibleTarget = _a.visibleTarget, focusPulse = _a.focusPulse, exitZoneMode = _a.exitZoneMode, 
    /** Bumps when Lightweight Charts instance is (re)created so subscriptions reattach. */
    chartGen = _a.chartGen, 
    /** When false, the Stop/Tgt/R:R chip is omitted (e.g. rendered in the manage header above TF chips). */
    _b = _a.showCornerStats, 
    /** When false, the Stop/Tgt/R:R chip is omitted (e.g. rendered in the manage header above TF chips). */
    showCornerStats = _b === void 0 ? true : _b;
    var _c = (0, react_1.useState)(0), coordTick = _c[0], setCoordTick = _c[1];
    var exitLabel = exitZoneMode === 'ai' ? 'AI Exit' : 'Exit zone';
    (0, react_1.useEffect)(function () {
        var _a;
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
        var hostSeries = candlesActive ? candleSeriesRef.current : lineSeriesRef.current;
        var paneIdx = (_a = hostSeries === null || hostSeries === void 0 ? void 0 : hostSeries.getPane().paneIndex()) !== null && _a !== void 0 ? _a : 0;
        var ps = chart.priceScale('right', paneIdx);
        if (typeof ps.subscribeVisiblePriceRangeChange === 'function') {
            ps.subscribeVisiblePriceRangeChange(bump);
        }
        var id = window.setInterval(bump, 650);
        return function () {
            ts.unsubscribeVisibleLogicalRangeChange(bump);
            ro.disconnect();
            if (typeof ps.unsubscribeVisiblePriceRangeChange === 'function') {
                ps.unsubscribeVisiblePriceRangeChange(bump);
            }
            window.clearInterval(id);
        };
    }, [chartRef, plotEl, chartGen, candlesActive, candleSeriesRef, lineSeriesRef]);
    void coordTick;
    var chart = chartRef.current;
    var series = candlesActive ? candleSeriesRef.current : lineSeriesRef.current;
    if (!plotEl || !chart || !series)
        return null;
    var showAny = visibleEntry || visibleStop || visibleTarget;
    if (!showAny)
        return null;
    var paneIdx = series.getPane().paneIndex();
    var measuredScaleW = chart.priceScale('right', paneIdx).width();
    var rightGutterPx = measuredScaleW > 0
        ? Math.min(140, Math.ceil(measuredScaleW + PRICE_SCALE_GUTTER_PAD_PX))
        : PRICE_SCALE_GUTTER_FALLBACK_PX;
    var H = plotEl.clientHeight;
    var W = plotEl.clientWidth;
    if (H < 8 || W < 8)
        return null;
    /** Bottom of series pane in `plotEl` coords (excludes time scale); fallback matches previous time gutter heuristic. */
    var plotBottom = H - 26;
    try {
        var paneEl = series.getPane().getHTMLElement();
        if (paneEl) {
            var pr = plotEl.getBoundingClientRect();
            var panr = paneEl.getBoundingClientRect();
            if (Number.isFinite(panr.bottom) && Number.isFinite(pr.top)) {
                plotBottom = Math.max(8, panr.bottom - pr.top - 2);
            }
        }
    }
    catch (_d) {
        /* keep fallback */
    }
    /** Pixels between the exact stop price and the start of the danger fill so the stop line stays visible on top of the chart. */
    var STOP_ZONE_GAP_PX = 6;
    var eBand = (0, tradePlanOverlayGeometry_1.entryBandPrices)(entry, stop);
    var tBand = (0, tradePlanOverlayGeometry_1.targetBandPrices)(target, entry, stop);
    var yE0 = priceToY(series, plotEl, eBand.lo);
    var yE1 = priceToY(series, plotEl, eBand.hi);
    var yEntry = priceToY(series, plotEl, entry);
    var yS = priceToY(series, plotEl, stop);
    var yT0 = priceToY(series, plotEl, tBand.lo);
    var yT1 = priceToY(series, plotEl, tBand.hi);
    var stopBoost = (0, tradePlanOverlayGeometry_1.stopProximityBoost)(lastPrice, stop, entry);
    var tgtBoost = (0, tradePlanOverlayGeometry_1.targetProximityBoost)(lastPrice, target, entry);
    var stopZone = null;
    if (visibleStop && yS != null) {
        if (side === 'long') {
            var top_1 = yS + STOP_ZONE_GAP_PX;
            stopZone = { top: top_1, height: Math.max(0, plotBottom - top_1) };
        }
        else {
            var h = Math.max(0, yS - STOP_ZONE_GAP_PX);
            stopZone = { top: 0, height: h };
        }
    }
    var entryZone = null;
    if (visibleEntry && yE0 != null && yE1 != null) {
        entryZone = ySpan(yE0, yE1);
    }
    var targetZone = null;
    if (visibleTarget && yT0 != null && yT1 != null) {
        targetZone = ySpan(yT0, yT1);
    }
    var lineY = {
        entry: visibleEntry ? yEntry : null,
        stop: visibleStop ? yS : null,
        target: visibleTarget ? priceToY(series, plotEl, target) : null,
    };
    var focusClass = focusPulse ? 'sigflo-trade-plan--focus-in' : '';
    return (<div className={"pointer-events-none absolute inset-0 overflow-hidden ".concat(focusClass)} aria-hidden>
      {stopZone && visibleStop ? (<div className="sigflo-trade-plan-zone sigflo-trade-plan-zone--stop absolute left-0" style={{
                right: rightGutterPx,
                top: stopZone.top,
                height: stopZone.height,
                opacity: stopBoost,
                background: side === 'long'
                    ? 'linear-gradient(180deg, rgba(248,113,113,0.22) 0%, rgba(248,113,113,0.06) 55%, transparent 100%)'
                    : 'linear-gradient(0deg, rgba(248,113,113,0.22) 0%, rgba(248,113,113,0.06) 55%, transparent 100%)',
                boxShadow: side === 'long'
                    ? 'inset 0 2px 24px rgba(248,113,113,0.25)'
                    : 'inset 0 -2px 24px rgba(248,113,113,0.25)',
            }}/>) : null}

      {entryZone && visibleEntry ? (<div className="sigflo-trade-plan-zone sigflo-trade-plan-zone--entry absolute left-0" style={{
                right: rightGutterPx,
                top: entryZone.top,
                height: entryZone.height,
                background: 'linear-gradient(180deg, rgba(45,212,191,0.14) 0%, rgba(45,212,191,0.05) 50%, rgba(45,212,191,0.12) 100%)',
            }}/>) : null}

      {targetZone && visibleTarget ? (<div className="sigflo-trade-plan-zone sigflo-trade-plan-zone--target absolute left-0 sigflo-exit-zone-pulse" style={{
                right: rightGutterPx,
                top: targetZone.top,
                height: targetZone.height,
                opacity: tgtBoost,
                background: 'linear-gradient(180deg, rgba(74,222,128,0.1) 0%, rgba(74,222,128,0.04) 45%, rgba(74,222,128,0.08) 100%)',
                borderTop: '1px solid rgba(74,222,128,0.18)',
                borderBottom: '1px solid rgba(74,222,128,0.18)',
            }}/>) : null}

      {lineY.entry != null && visibleEntry ? (<div className="sigflo-trade-plan-line sigflo-trade-plan-line--entry absolute left-0" style={{ top: lineY.entry - 0.5, height: 1, right: rightGutterPx }}/>) : null}
      {lineY.stop != null && visibleStop ? (<div className="sigflo-trade-plan-line sigflo-trade-plan-line--stop absolute left-0 z-[35]" style={{ top: lineY.stop - 0.5, height: 1, right: rightGutterPx }}/>) : null}
      {lineY.target != null && visibleTarget ? (<div className="sigflo-trade-plan-line sigflo-trade-plan-line--target absolute left-0" style={{ top: lineY.target - 0.5, height: 1, right: rightGutterPx }}/>) : null}

      {visibleEntry && lineY.entry != null ? (<div className="absolute z-30 rounded-md border border-teal-400/35 bg-[#0c0c0f] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-100 shadow-[0_0_12px_rgba(45,212,191,0.35)]" style={{ left: 8, top: Math.max(4, lineY.entry - 22) }}>
          Entry
        </div>) : null}

      {visibleStop && lineY.stop != null ? (<div className="absolute z-30 rounded-md border border-rose-400/45 bg-[#0c0c0f] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-100 shadow-[0_0_16px_rgba(248,113,113,0.45)]" style={{ left: 8, top: Math.min(plotBottom - 28, Math.max(4, lineY.stop - 22)) }}>
          Stop
        </div>) : null}

      {visibleTarget && lineY.target != null ? (<div className="absolute z-30 rounded-md border border-emerald-400/35 bg-[#0c0c0f] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-100 shadow-[0_0_14px_rgba(74,222,128,0.35)]" style={{ left: 8, top: Math.max(4, lineY.target - 22) }}>
          {exitLabel}
        </div>) : null}

      {showCornerStats ? (<TradePlanCornerStats_1.TradePlanCornerStats entry={entry} stop={stop} target={target} lastPrice={lastPrice} riskReward={riskReward} className="absolute top-2 z-30 max-w-[min(100%,11rem)]" style={{ right: rightGutterPx + CORNER_STATS_RIGHT_GAP_PX }}/>) : null}
    </div>);
}
