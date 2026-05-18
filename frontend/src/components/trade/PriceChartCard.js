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
exports.PriceChartCard = PriceChartCard;
var react_1 = require("react");
var Card_1 = require("@/components/ui/Card");
var lightweight_charts_1 = require("lightweight-charts");
var MarketStatsRow_1 = require("@/components/trade/MarketStatsRow");
var SetupToggle_1 = require("@/components/trade/SetupToggle");
var TradePlanCornerStats_1 = require("@/components/trade/TradePlanCornerStats");
var TradePlanDragHandles_1 = require("@/components/trade/TradePlanDragHandles");
var TradePlanZonesOverlay_1 = require("@/components/trade/TradePlanZonesOverlay");
var tradeChartHeights_1 = require("@/config/tradeChartHeights");
var chartColorUtils_1 = require("@/lib/chartColorUtils");
var chartSetupFocus_1 = require("@/lib/chartSetupFocus");
var tradeTimingChip_1 = require("@/lib/tradeTimingChip");
var formatQuote_1 = require("@/lib/formatQuote");
var tradeChartLevels_1 = require("@/lib/tradeChartLevels");
/** Normalize pair for setup-focus filter (`BTC` vs `BTC / USDT`). */
function chartSetupFocusPairBase(pair) {
    var _a;
    var raw = pair.trim().toUpperCase();
    if (raw.includes('/')) {
        return ((_a = raw.split('/')[0]) === null || _a === void 0 ? void 0 : _a.trim().replace(/[^A-Z0-9]/g, '')) || '';
    }
    return raw.replace(/USDT$/i, '').replace(/[^A-Z0-9]/g, '') || '';
}
var levelStyles = {
    entry: { label: 'Entry', stroke: tradeChartLevels_1.TRADE_CHART_LEVEL_COLORS.entry, labelClass: 'text-teal-300' },
    stop: { label: 'Stop', stroke: tradeChartLevels_1.TRADE_CHART_LEVEL_COLORS.stop, labelClass: 'text-rose-300' },
    target: { label: 'Target', stroke: tradeChartLevels_1.TRADE_CHART_LEVEL_COLORS.target, labelClass: 'text-emerald-300' },
    liquidation: {
        label: 'Liq.',
        stroke: tradeChartLevels_1.TRADE_CHART_LEVEL_COLORS.liquidation,
        labelClass: 'text-amber-200',
    },
};
/** Ease-out fade for setup overlays (entry / stop / target / liq). */
var SETUP_LINE_ANIM_MS = 175;
function toUtcTime(tsMs) {
    return Math.floor(tsMs / 1000);
}
function timePointToLocalDate(time) {
    var utc;
    if (typeof time === 'number') {
        utc = new Date(time * 1000);
    }
    else if (typeof time === 'string') {
        utc = new Date("".concat(time, "T00:00:00Z"));
    }
    else {
        utc = new Date(Date.UTC(time.year, time.month - 1, time.day));
    }
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), utc.getUTCHours(), utc.getUTCMinutes(), utc.getUTCSeconds(), utc.getUTCMilliseconds());
}
/** Compact time-axis labels; smaller glyph strings help LC fit ticks in short plot heights. */
function formatTimeScaleTick(time, tickMarkType, locale) {
    var d = timePointToLocalDate(time);
    switch (tickMarkType) {
        case lightweight_charts_1.TickMarkType.Year:
            return d.toLocaleString(locale, { year: 'numeric' });
        case lightweight_charts_1.TickMarkType.Month:
            return d.toLocaleString(locale, { month: 'short' });
        case lightweight_charts_1.TickMarkType.DayOfMonth:
            return d.toLocaleString(locale, { month: 'short', day: 'numeric' });
        case lightweight_charts_1.TickMarkType.Time:
            return d.toLocaleString(locale, { hour: 'numeric', minute: '2-digit', hour12: false });
        case lightweight_charts_1.TickMarkType.TimeWithSeconds:
            return d.toLocaleString(locale, {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
        default:
            return null;
    }
}
function PriceChartCard(_a) {
    var _b;
    var _c, _d, _e;
    var model = _a.model, market = _a.market, intervalLabel = _a.intervalLabel, loadingInterval = _a.loadingInterval, liveUpdatedAt = _a.liveUpdatedAt, 
    /** When set, shows a chart-hero title row (pair) above the live price. */
    heroPairLabel = _a.heroPairLabel, change24hPct = _a.change24hPct, _f = _a.chartHeightPx, chartHeightPx = _f === void 0 ? tradeChartHeights_1.TRADE_CHART_PLOT_EXPANDED_PX : _f, timeframeOptions = _a.timeframeOptions, chartInterval = _a.chartInterval, onChartIntervalChange = _a.onChartIntervalChange, 
    /** Fixed plot height (px). When set, overrides dvh / --chart-h-desktop (e.g. collapsible trade header). */
    chartPlotHeightPx = _a.chartPlotHeightPx, _g = _a.exchangeStyleHero, exchangeStyleHero = _g === void 0 ? false : _g, metaCaption = _a.metaCaption, setupMode = _a.setupMode, onSetupModeToggle = _a.onSetupModeToggle, onRequestSetupMode = _a.onRequestSetupMode, tradeTimingState = _a.tradeTimingState, 
    /** When true, chart chrome emphasizes active position context (header metrics, optional proximity). */
    _h = _a.liveTradeMode, 
    /** When true, chart chrome emphasizes active position context (header metrics, optional proximity). */
    liveTradeMode = _h === void 0 ? false : _h, 
    /** Extra horizontal levels (e.g. trim) — not toggled via overlay chips. */
    auxiliaryPriceLines = _a.auxiliaryPriceLines, 
    /** Compact R / T / R:R (+ optional badge) under the exchange hero row. */
    liveHeaderMetrics = _a.liveHeaderMetrics, 
    /** When this key changes, refit time scale once so entry/stop/target stay in view. */
    liveTradeRefitKey = _a.liveTradeRefitKey, 
    /**
     * When this key changes (e.g. bot focus route / pair context), refit + scroll to the live edge so the latest
     * candle is aligned like Trade screen — not stuck on early history after OHLC loads.
     */
    chartViewportSnapKey = _a.chartViewportSnapKey, 
    /** Subtle frame hint when price is near stop or target. */
    _j = _a.chartProximity, 
    /** Subtle frame hint when price is near stop or target. */
    chartProximity = _j === void 0 ? null : _j, 
    /**
     * When true (open position), apply the Live Trade overlay preset once and auto-enable liq when it becomes
     * available unless the user toggled it. Resets to setup (all off) when false. Manual chip toggles while
     * live are tracked per-level until the position closes.
     */
    _k = _a.liveTradeOverlayPreset, 
    /**
     * When true (open position), apply the Live Trade overlay preset once and auto-enable liq when it becomes
     * available unless the user toggled it. Resets to setup (all off) when false. Manual chip toggles while
     * live are tracked per-level until the position closes.
     */
    liveTradeOverlayPreset = _k === void 0 ? false : _k, 
    /**
     * When true, the exchange TF row still shows last price + 24h; `liveHeaderMetrics.secondaryLine` (e.g. uPnL)
     * is merged into that left cluster instead of duplicating last in a separate live-metrics band.
     */
    _l = _a.suppressExchangeHeroLivePrice, 
    /**
     * When true, the exchange TF row still shows last price + 24h; `liveHeaderMetrics.secondaryLine` (e.g. uPnL)
     * is merged into that left cluster instead of duplicating last in a separate live-metrics band.
     */
    suppressExchangeHeroLivePrice = _l === void 0 ? false : _l, 
    /** Strip label when `liveTradeMode` (open position context). */
    _m = _a.liveActivePositionTitle, 
    /** Strip label when `liveTradeMode` (open position context). */
    liveActivePositionTitle = _m === void 0 ? 'Live position' : _m, pnlHeaderLabel = _a.pnlHeaderLabel, pnlHeaderTone = _a.pnlHeaderTone, timeScaleMaxBarSpacingPx = _a.timeScaleMaxBarSpacingPx, chartInnerChromeToggle = _a.chartInnerChromeToggle, onSetupFocusBanner = _a.onSetupFocusBanner, 
    /** When true, plot height fills space below header chrome (parent must be a flex column with bounded height). */
    _o = _a.chartPlotFlexFill, 
    /** When true, plot height fills space below header chrome (parent must be a flex column with bounded height). */
    chartPlotFlexFill = _o === void 0 ? false : _o, 
    /** Premium zone overlay: exit label when live / AI exit tooling is active. */
    _p = _a.tradePlanExitLabel, 
    /** Premium zone overlay: exit label when live / AI exit tooling is active. */
    tradePlanExitLabel = _p === void 0 ? 'exit' : _p, 
    /** When Setup premium zones are on, allow dragging stop/target hit strips (parent updates plan inputs). */
    _q = _a.draggablePlanLevels, 
    /** When Setup premium zones are on, allow dragging stop/target hit strips (parent updates plan inputs). */
    draggablePlanLevels = _q === void 0 ? false : _q, onPlanStopChange = _a.onPlanStopChange, onPlanTargetChange = _a.onPlanTargetChange, onPlanStopDragEnd = _a.onPlanStopDragEnd, onPlanTargetDragEnd = _a.onPlanTargetDragEnd;
    var showTimeframeBar = Boolean((timeframeOptions === null || timeframeOptions === void 0 ? void 0 : timeframeOptions.length) && chartInterval != null && onChartIntervalChange);
    /** Exchange trade header: price/TF row should meet the plot with no extra chrome gap. */
    var exchangeTfHero = Boolean(exchangeStyleHero && showTimeframeBar && timeframeOptions && chartInterval != null && onChartIntervalChange);
    /** Bot focus: pull price + TF row down toward the plot; trade dock keeps the tighter `items-end` strip. */
    var immersiveTfHero = exchangeTfHero && (chartInnerChromeToggle === null || chartInnerChromeToggle === void 0 ? void 0 : chartInnerChromeToggle.variant) === 'immersive';
    var pnlHeaderToneClass = pnlHeaderTone === 'positive'
        ? 'text-emerald-300'
        : pnlHeaderTone === 'negative'
            ? 'text-rose-300'
            : 'text-sigflo-muted';
    var showLiquidation = market === 'futures';
    var setupControlled = typeof setupMode === 'boolean';
    /** Latest setup flag for async fade-out (avoid clearing overlays after user re-enters Setup). */
    var setupModeLiveRef = (0, react_1.useRef)(setupMode === true);
    (0, react_1.useEffect)(function () {
        setupModeLiveRef.current = setupMode === true;
    }, [setupMode]);
    var prevSetupOnRef = (0, react_1.useRef)(undefined);
    /** One-shot: animate setup lines in only when entering Setup mode (not when toggling individual levels). */
    var setupFadeInArmRef = (0, react_1.useRef)(false);
    /** Last timed alpha used for setup lines — so fade-out matches visibility when leaving Setup. */
    var lastSetupAlphaScaleRef = (0, react_1.useRef)(1);
    var _r = (0, react_1.useState)(true), showVolume = _r[0], setShowVolume = _r[1];
    var _s = (0, react_1.useState)('flat'), priceDirection = _s[0], setPriceDirection = _s[1];
    /** Single plot host — fixed height + overflow-hidden; autoSize tracks this element. */
    var chartContainerRef = (0, react_1.useRef)(null);
    var _t = (0, react_1.useState)(null), chartPlotMountEl = _t[0], setChartPlotMountEl = _t[1];
    var _u = (0, react_1.useState)(0), tradePlanChartGen = _u[0], setTradePlanChartGen = _u[1];
    var bindChartPlotEl = (0, react_1.useCallback)(function (node) {
        chartContainerRef.current = node;
        setChartPlotMountEl(node);
    }, []);
    /** After pointer down, first move past this threshold disables price autoscale so LC can scroll the Y range. */
    var pricePanPrimedRef = (0, react_1.useRef)(null);
    var chartRef = (0, react_1.useRef)(null);
    var candleRef = (0, react_1.useRef)(null);
    var lineRef = (0, react_1.useRef)(null);
    var volRef = (0, react_1.useRef)(null);
    var priceLineByKeyRef = (0, react_1.useRef)({});
    var auxPriceLineByIdRef = (0, react_1.useRef)({});
    /** Which series owns `priceLineByKeyRef` — must match candle vs line fallback in data effect. */
    var priceLineHostModeRef = (0, react_1.useRef)(null);
    var _v = (0, react_1.useState)(false), setupFocusPulse = _v[0], setSetupFocusPulse = _v[1];
    /** After programmatic setup zoom, block candle refresh from forcing price autoscale. */
    var lockSetupPriceViewportRef = (0, react_1.useRef)(false);
    var onSetupFocusBannerRef = (0, react_1.useRef)(onSetupFocusBanner);
    onSetupFocusBannerRef.current = onSetupFocusBanner;
    /** Manage-position hero TF strip: active chip ref for scroll-into-view (narrow widths + overflow-x). */
    var heroTfActiveChipRef = (0, react_1.useRef)(null);
    var heroTfScrollRef = (0, react_1.useRef)(null);
    var _w = (0, react_1.useState)({
        entry: false,
        stop: false,
        target: false,
        liquidation: false,
    }), visibleLevels = _w[0], setVisibleLevels = _w[1];
    /** Set when leaving Clean via a single overlay chip — next Setup entry shows only that level. */
    var _x = (0, react_1.useState)(null), soloOverlayFromClean = _x[0], setSoloOverlayFromClean = _x[1];
    /** Tracks market futures/spot for liq sync (avoid forcing liq on every Setup toggle). */
    var prevShowLiqForSyncRef = (0, react_1.useRef)(showLiquidation);
    var prevSetupModeForSoloRef = (0, react_1.useRef)(setupMode);
    var prevLiveOverlayPresetRef = (0, react_1.useRef)(undefined);
    var liveOverlayTouchedKeysRef = (0, react_1.useRef)(new Set());
    (0, react_1.useEffect)(function () {
        if (setupControlled && prevSetupModeForSoloRef.current === true && setupMode === false) {
            setSoloOverlayFromClean(null);
        }
        prevSetupModeForSoloRef.current = setupMode;
    }, [setupMode, setupControlled]);
    (0, react_1.useLayoutEffect)(function () {
        var _a;
        if (!heroPairLabel || !showTimeframeBar)
            return;
        var strip = heroTfScrollRef.current;
        if (strip)
            strip.scrollLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
        (_a = heroTfActiveChipRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, [heroPairLabel, showTimeframeBar, chartInterval]);
    (0, react_1.useEffect)(function () {
        if (!setupControlled)
            return;
        if (!setupMode) {
            prevSetupOnRef.current = false;
            return;
        }
        var wasOn = prevSetupOnRef.current === true;
        prevSetupOnRef.current = true;
        if (wasOn)
            return;
        setupFadeInArmRef.current = true;
        var solo = soloOverlayFromClean;
        if (solo != null) {
            setSoloOverlayFromClean(null);
            setVisibleLevels({
                entry: solo === 'entry',
                stop: solo === 'stop',
                target: solo === 'target',
                liquidation: solo === 'liquidation' && showLiquidation,
            });
            prevShowLiqForSyncRef.current = showLiquidation;
            return;
        }
        if (liveTradeOverlayPreset) {
            liveOverlayTouchedKeysRef.current.clear();
            setVisibleLevels((0, tradeChartLevels_1.buildChartOverlayPresetLive)(showLiquidation, model.liquidation));
            prevShowLiqForSyncRef.current = showLiquidation;
            return;
        }
        setVisibleLevels({
            entry: true,
            stop: true,
            target: true,
            liquidation: showLiquidation,
        });
        prevShowLiqForSyncRef.current = showLiquidation;
    }, [setupMode, setupControlled, showLiquidation, soloOverlayFromClean, liveTradeOverlayPreset, model.liquidation]);
    /** Enter / exit live trade: preset overlay toggles; reset touches when the preset boundary changes. */
    (0, react_1.useEffect)(function () {
        if (!setupControlled)
            return;
        var prev = prevLiveOverlayPresetRef.current;
        var next = liveTradeOverlayPreset;
        prevLiveOverlayPresetRef.current = next;
        if (next && prev !== true) {
            liveOverlayTouchedKeysRef.current.clear();
            setVisibleLevels((0, tradeChartLevels_1.buildChartOverlayPresetLive)(showLiquidation, model.liquidation));
            setupFadeInArmRef.current = true;
            prevSetupOnRef.current = true;
            return;
        }
        if (!next && prev === true) {
            liveOverlayTouchedKeysRef.current.clear();
            prevSetupOnRef.current = false;
            // If still in Setup mode, keep entry/stop/target visible instead of blanking to all-off.
            // Without this, levels stay hidden because effect 340's wasOn guard stays true.
            if (setupModeLiveRef.current) {
                setVisibleLevels({ entry: true, stop: true, target: true, liquidation: showLiquidation });
            }
            else {
                setVisibleLevels((0, tradeChartLevels_1.chartOverlayPresetSetupLevels)());
            }
            return;
        }
    }, [liveTradeOverlayPreset, setupControlled, showLiquidation, model.liquidation]);
    /** While live: turn liq on when a valid price appears, unless the user already toggled liq. */
    (0, react_1.useEffect)(function () {
        if (!setupControlled || !setupMode || !liveTradeOverlayPreset)
            return;
        if (liveOverlayTouchedKeysRef.current.has('liquidation'))
            return;
        var liqOn = showLiquidation &&
            model.liquidation != null &&
            Number.isFinite(model.liquidation) &&
            model.liquidation > 0;
        if (!liqOn)
            return;
        setVisibleLevels(function (prev) { return (prev.liquidation ? prev : __assign(__assign({}, prev), { liquidation: true })); });
    }, [liveTradeOverlayPreset, model.liquidation, setupControlled, setupMode, showLiquidation]);
    /** Futures ↔ spot: sync liq row visibility unless user overrode liq during live trade. */
    (0, react_1.useEffect)(function () {
        if (!setupControlled || !setupMode) {
            prevShowLiqForSyncRef.current = showLiquidation;
            return;
        }
        if (prevShowLiqForSyncRef.current === showLiquidation)
            return;
        prevShowLiqForSyncRef.current = showLiquidation;
        if (liveTradeOverlayPreset && liveOverlayTouchedKeysRef.current.has('liquidation')) {
            return;
        }
        setVisibleLevels(function (prev) { return (__assign(__assign({}, prev), { liquidation: showLiquidation })); });
    }, [showLiquidation, setupMode, setupControlled, liveTradeOverlayPreset]);
    var visibleLevelKeys = (0, react_1.useMemo)(function () {
        return Object.keys(levelStyles)
            .filter(function (key) { return (key === 'liquidation' ? showLiquidation : true); })
            .filter(function (key) { return visibleLevels[key]; });
    }, [showLiquidation, visibleLevels]);
    var usePremiumTradeZones = setupControlled && setupMode === true;
    /** Must match candle vs line branch below: we draw OHLC whenever `length > 0`, so overlays / price lines must use the same host series. */
    var candlesActiveOverlay = ((_d = (_c = model.chartCandles) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 0;
    var premiumZonesVisible = usePremiumTradeZones && (visibleLevels.entry || visibleLevels.stop || visibleLevels.target);
    /** Keep the live last-price line visible; only hide the axis value chip when premium zones are active. */
    (0, react_1.useEffect)(function () {
        var candle = candleRef.current;
        var line = lineRef.current;
        if (!candle || !line)
            return;
        var showLastValueOnScale = !premiumZonesVisible;
        candle.applyOptions({ lastValueVisible: showLastValueOnScale, priceLineVisible: true });
        line.applyOptions({ lastValueVisible: showLastValueOnScale, priceLineVisible: true });
    }, [premiumZonesVisible]);
    var useTimedSetupOverlays = setupControlled && setupMode && tradeTimingState != null;
    var setupOverlayVisual = (0, react_1.useMemo)(function () {
        if (!useTimedSetupOverlays || tradeTimingState == null) {
            return { alphaScale: 1, entryLineExtraWidth: 0 };
        }
        return (0, tradeTimingChip_1.tradeTimingOverlayVisual)(tradeTimingState);
    }, [tradeTimingState, useTimedSetupOverlays]);
    (0, react_1.useEffect)(function () {
        if (useTimedSetupOverlays) {
            lastSetupAlphaScaleRef.current = setupOverlayVisual.alphaScale;
        }
    }, [useTimedSetupOverlays, setupOverlayVisual.alphaScale]);
    var liveTime = liveUpdatedAt
        ? new Date(liveUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : null;
    var prevPriceRef = (0, react_1.useRef)(model.lastPrice);
    /** Avoid full setData + fitContent on every tick; update last bar only when same candle. */
    var candleStructRef = (0, react_1.useRef)(null);
    /** Only auto-fit when pair/interval changes or first paint — not on every new candle (preserves zoom). */
    var chartViewKeyRef = (0, react_1.useRef)('');
    var didFitContentRef = (0, react_1.useRef)(false);
    /**
     * Line fallback runs while OHLC is empty (`priceSeries` can still be synthetic). That path sets
     * `didFitContentRef`; when real candles arrive we must refit + `scrollToRealTime` or the viewport
     * stays aligned to the short synthetic series instead of the latest candle.
     */
    var hadOhlcCandlesRef = (0, react_1.useRef)(false);
    /** Last bar logical index (0-based) for live-edge detection — updated when series data changes. */
    var lastBarLogicalIndexRef = (0, react_1.useRef)(0);
    /** While true, `subscribeVisibleLogicalRangeChange` ignores updates (programmatic fit/scroll). */
    var programmaticViewportRef = (0, react_1.useRef)(false);
    /**
     * When true, live ticks skip `scrollToRealTime` (viewport stays put). Set when the user pans away from the
     * live edge, leaves the chart plot (`pointerleave`), or the window blurs; cleared when the viewport is
     * back at the live edge (pan or `pointerenter` resync) or on pair/interval / refit.
     */
    var skipScrollToRealTimeRef = (0, react_1.useRef)(false);
    /** Line fallback (≤10 candles): avoid `Date.now()` per point — shifting times on every tick resets the x-axis. */
    var lineFallbackAnchorSecRef = (0, react_1.useRef)(Math.floor(Date.now() / 1000));
    var lineFallbackSeriesLenRef = (0, react_1.useRef)(-1);
    var runProgrammaticViewport = (0, react_1.useCallback)(function (fn) {
        programmaticViewportRef.current = true;
        try {
            fn();
        }
        finally {
            requestAnimationFrame(function () {
                programmaticViewportRef.current = false;
            });
        }
    }, []);
    var handleSetupFocusRef = (0, react_1.useRef)(function () { });
    handleSetupFocusRef.current = function (d) {
        var _a;
        var pairFilter = d === null || d === void 0 ? void 0 : d.pairFilter;
        var botName = d === null || d === void 0 ? void 0 : d.botName;
        if (pairFilter) {
            var fa = chartSetupFocusPairBase(pairFilter);
            var fb = chartSetupFocusPairBase(model.pair);
            if (fa && fb && fa !== fb)
                return;
        }
        onRequestSetupMode === null || onRequestSetupMode === void 0 ? void 0 : onRequestSetupMode();
        var entry = model.entry;
        var stop = model.stop;
        var target = model.target;
        var last = model.lastPrice;
        var prices = [entry, stop, target, last].filter(function (p) { return typeof p === 'number' && Number.isFinite(p) && p > 0; });
        if (prices.length < 2)
            return;
        setVisibleLevels(function (prev) { return (__assign(__assign({}, prev), { entry: true, stop: true, target: true, liquidation: false })); });
        setSetupFocusPulse(true);
        window.setTimeout(function () { return setSetupFocusPulse(false); }, 2600);
        var label = botName != null && String(botName).trim().length > 0
            ? "Viewing ".concat(String(botName).trim(), " setup")
            : 'Viewing setup on chart';
        (_a = onSetupFocusBannerRef.current) === null || _a === void 0 ? void 0 : _a.call(onSetupFocusBannerRef, label);
        var easeOutCubic = function (t) { return 1 - Math.pow((1 - t), 3); };
        var durationMs = 420;
        var startAnim = function () {
            var chart = chartRef.current;
            if (!chart)
                return;
            var lastIdx = Math.max(0, lastBarLogicalIndexRef.current);
            var targetFromL = Math.max(0, lastIdx - 72);
            var targetToL = lastIdx + 4;
            /**
             * Animate **time** only. Animating the price scale to entry/stop/target can clip candles when those
             * levels sit far from live OHLC (e.g. stale plan vs ~72k spot). Autoscale keeps price + lines in view.
             */
            runProgrammaticViewport(function () {
                try {
                    chart.priceScale('right').setAutoScale(true);
                }
                catch (_a) {
                    /* ignore */
                }
            });
            requestAnimationFrame(function () {
                var _a, _b;
                var chart2 = chartRef.current;
                if (!chart2)
                    return;
                var ts = chart2.timeScale();
                var lStart = ts.getVisibleLogicalRange();
                var fromL0 = (_a = lStart === null || lStart === void 0 ? void 0 : lStart.from) !== null && _a !== void 0 ? _a : targetFromL;
                var toL0 = (_b = lStart === null || lStart === void 0 ? void 0 : lStart.to) !== null && _b !== void 0 ? _b : targetToL;
                var t0 = performance.now();
                var tick = function (now) {
                    var c = chartRef.current;
                    if (!c)
                        return;
                    var tss = c.timeScale();
                    var u = Math.min(1, (now - t0) / durationMs);
                    var e = easeOutCubic(u);
                    var lf = fromL0 + (targetFromL - fromL0) * e;
                    var lt = toL0 + (targetToL - toL0) * e;
                    var lLo = Math.min(lf, lt);
                    var lHi = Math.max(lf, lt);
                    try {
                        runProgrammaticViewport(function () {
                            tss.setVisibleLogicalRange({ from: lLo, to: lHi });
                        });
                    }
                    catch (_a) {
                        /* LC may reject degenerate ranges */
                    }
                    if (u < 1)
                        requestAnimationFrame(tick);
                    else
                        skipScrollToRealTimeRef.current = true;
                };
                requestAnimationFrame(tick);
            });
        };
        var tryMount = function (attempt) {
            if (!chartRef.current) {
                if (attempt < 20)
                    requestAnimationFrame(function () { return tryMount(attempt + 1); });
                return;
            }
            startAnim();
        };
        requestAnimationFrame(function () { return tryMount(0); });
    };
    (0, react_1.useEffect)(function () {
        var fn = function (e) {
            var ce = e;
            handleSetupFocusRef.current(ce.detail);
        };
        window.addEventListener(chartSetupFocus_1.CHART_SETUP_FOCUS_EVENT, fn);
        return function () { return window.removeEventListener(chartSetupFocus_1.CHART_SETUP_FOCUS_EVENT, fn); };
    }, []);
    /** After full `setData`, restore horizontal zoom when the user had panned off the live edge. */
    function clampVisibleLogicalRange(chart, saved, lastIdx) {
        if (!saved || lastIdx < 0)
            return;
        var from = Math.max(0, Math.min(saved.from, lastIdx));
        var to = Math.max(from, Math.min(saved.to, lastIdx));
        if (to - from < 0.2)
            return;
        chart.timeScale().setVisibleLogicalRange({ from: from, to: to });
    }
    /** Latest viewport→skip logic for subscription + pointer handlers (chart mounts in layout effect). */
    var applySkipScrollFromViewportRef = (0, react_1.useRef)(function () { });
    applySkipScrollFromViewportRef.current = function () {
        if (programmaticViewportRef.current)
            return;
        var chart = chartRef.current;
        if (!chart)
            return;
        var range = chart.timeScale().getVisibleLogicalRange();
        if (!range)
            return;
        var lastIdx = lastBarLogicalIndexRef.current;
        if (lastIdx <= 0) {
            skipScrollToRealTimeRef.current = false;
            return;
        }
        var atLiveEdge = range.to >= lastIdx - 0.5;
        skipScrollToRealTimeRef.current = !atLiveEdge;
    };
    var staticLevelPrices = (0, react_1.useMemo)(function () {
        return ({
            entry: model.entry,
            stop: model.stop,
            target: model.target,
            liquidation: model.liquidation,
        });
    }, [model.entry, model.liquidation, model.stop, model.target]);
    (0, react_1.useLayoutEffect)(function () {
        var el = chartContainerRef.current;
        if (!el)
            return;
        var chart = (0, lightweight_charts_1.createChart)(el, {
            autoSize: true,
            layout: {
                background: { type: lightweight_charts_1.ColorType.Solid, color: '#0c0c0f' },
                textColor: 'rgba(148,163,184,0.9)',
                /** Drives time + price scale label metrics (shared by lightweight-charts). */
                fontSize: 12,
                /** Hides bottom-left TV mark so custom trade labels (e.g. Stop) are not covered. Keep attribution in app docs if required by license. */
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.03)' },
                horzLines: { color: 'rgba(255,255,255,0.06)' },
            },
            /** Default is Magnet/MagnetOHLC — snaps to bar OHLC; Normal follows the cursor. */
            crosshair: {
                mode: lightweight_charts_1.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.12)',
                /** LC default is `{ top: 0.2, bottom: 0.1 }`. Tighter bottom keeps time labels snug; top must stay ≥ default or highs/wicks clip under `overflow-hidden`. */
                scaleMargins: { top: 0.26, bottom: 0.02 },
            },
            timeScale: __assign({ borderColor: 'rgba(255,255,255,0.12)', rightOffset: 1, borderVisible: false, 
                /** Default is false: intraday ticks use day-of-month only → "4" repeated on one calendar day. */
                timeVisible: true, secondsVisible: false, allowBoldLabels: false, tickMarkFormatter: formatTimeScaleTick }, (typeof timeScaleMaxBarSpacingPx === 'number' &&
                Number.isFinite(timeScaleMaxBarSpacingPx) &&
                timeScaleMaxBarSpacingPx > 0
                ? { maxBarSpacing: timeScaleMaxBarSpacingPx }
                : {})),
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                mouseWheel: true,
                pinch: true,
                axisPressedMouseMove: { time: true, price: true },
            },
            /** Touch: exit crosshair/inspect mode on lift so the next gesture can pan/zoom without an extra tap. */
            trackingMode: { exitMode: lightweight_charts_1.TrackingModeExitMode.OnTouchEnd },
        });
        var candleSeries = chart.addSeries(lightweight_charts_1.CandlestickSeries, {
            upColor: '#34d399',
            downColor: '#f87171',
            borderUpColor: '#34d399',
            borderDownColor: '#f87171',
            wickUpColor: '#34d399',
            wickDownColor: '#f87171',
            lastValueVisible: true,
            priceLineVisible: true,
            /** LC default is dashed — reads as “dotted” under HTML trade overlays when last ≈ entry. */
            priceLineStyle: lightweight_charts_1.LineStyle.Solid,
        });
        var lineSeries = chart.addSeries(lightweight_charts_1.LineSeries, {
            color: '#22d3ee',
            lineWidth: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: true,
            priceLineVisible: true,
            priceLineStyle: lightweight_charts_1.LineStyle.Solid,
        });
        var volSeries = chart.addSeries(lightweight_charts_1.HistogramSeries, {
            priceScaleId: '',
            priceFormat: { type: 'volume' },
            lastValueVisible: false,
            priceLineVisible: false,
        });
        /** Larger `top` = thinner volume band at bottom of pane (frees height for candles + time row feels shorter). */
        volSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.91, bottom: 0 },
        });
        chartRef.current = chart;
        candleRef.current = candleSeries;
        lineRef.current = lineSeries;
        volRef.current = volSeries;
        setTradePlanChartGen(function (g) { return g + 1; });
        var onVisibleLogicalRangeChange = function () { return applySkipScrollFromViewportRef.current(); };
        var timeScale = chart.timeScale();
        timeScale.subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);
        return function () {
            timeScale.unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);
            priceLineByKeyRef.current = {};
            auxPriceLineByIdRef.current = {};
            priceLineHostModeRef.current = null;
            chartViewKeyRef.current = '';
            didFitContentRef.current = false;
            candleStructRef.current = null;
            skipScrollToRealTimeRef.current = false;
            chart.remove();
            chartRef.current = null;
            candleRef.current = null;
            lineRef.current = null;
            volRef.current = null;
        };
    }, [timeScaleMaxBarSpacingPx]);
    /** Keep LC in sync with the plot box — `chartPlotHeightPx` uses CSS `transition` on height; a one-shot effect
     * often read stale `clientHeight`. ResizeObserver + rAF resizes after layout and through the transition. */
    (0, react_1.useLayoutEffect)(function () {
        var el = chartContainerRef.current;
        var chart = chartRef.current;
        if (!el || !chart)
            return;
        var raf = 0;
        var fit = function () {
            if (raf !== 0)
                cancelAnimationFrame(raf);
            raf = window.requestAnimationFrame(function () {
                raf = 0;
                var w = Math.max(1, Math.round(el.clientWidth));
                var h = Math.max(1, Math.round(el.clientHeight));
                chart.resize(w, h);
            });
        };
        fit();
        var ro = new ResizeObserver(fit);
        ro.observe(el);
        return function () {
            ro.disconnect();
            if (raf !== 0)
                window.cancelAnimationFrame(raf);
        };
    }, []);
    /** Stop live auto-scroll when focus leaves the page (e.g. another tab) — same as leaving the chart. */
    (0, react_1.useEffect)(function () {
        var onBlur = function () {
            skipScrollToRealTimeRef.current = true;
        };
        window.addEventListener('blur', onBlur);
        return function () { return window.removeEventListener('blur', onBlur); };
    }, []);
    (0, react_1.useEffect)(function () {
        var _a, _b;
        var candleSeries = candleRef.current;
        var lineSeries = lineRef.current;
        var volSeries = volRef.current;
        if (!candleSeries || !lineSeries || !volSeries)
            return;
        var viewKey = "".concat(model.pair, "|").concat(intervalLabel !== null && intervalLabel !== void 0 ? intervalLabel : '');
        if (chartViewKeyRef.current !== viewKey) {
            chartViewKeyRef.current = viewKey;
            didFitContentRef.current = false;
            candleStructRef.current = null;
            skipScrollToRealTimeRef.current = false;
            lineFallbackSeriesLenRef.current = -1;
            lockSetupPriceViewportRef.current = false;
            hadOhlcCandlesRef.current = false;
        }
        var candles = (_a = model.chartCandles) !== null && _a !== void 0 ? _a : [];
        if (candles.length === 0) {
            hadOhlcCandlesRef.current = false;
        }
        else if (!hadOhlcCandlesRef.current) {
            hadOhlcCandlesRef.current = true;
            didFitContentRef.current = false;
        }
        if (candles.length > 0) {
            lineFallbackSeriesLenRef.current = -1;
            var last_1 = candles[candles.length - 1];
            var struct = candleStructRef.current;
            var sameCandle = last_1 &&
                struct &&
                struct.len === candles.length &&
                struct.lastTs === last_1.ts;
            lastBarLogicalIndexRef.current = Math.max(0, candles.length - 1);
            if (sameCandle && last_1) {
                var t = toUtcTime(last_1.ts);
                candleSeries.update({
                    time: t,
                    open: last_1.open,
                    high: last_1.high,
                    low: last_1.low,
                    close: last_1.close,
                });
                volSeries.update({
                    time: t,
                    value: (_b = last_1.volume) !== null && _b !== void 0 ? _b : 0,
                    color: last_1.close >= last_1.open ? 'rgba(52,211,153,0.30)' : 'rgba(248,113,113,0.30)',
                });
                // Intrabar OHLC updates share the same logical index — do not scroll; avoids viewport drift / “resets”.
            }
            else {
                var chart_1 = chartRef.current;
                var ts_1 = chart_1 === null || chart_1 === void 0 ? void 0 : chart_1.timeScale();
                var preserveViewport_1 = skipScrollToRealTimeRef.current;
                var savedLogical_1 = preserveViewport_1 && chart_1 && ts_1 ? ts_1.getVisibleLogicalRange() : null;
                var lastIdx_1 = Math.max(0, candles.length - 1);
                runProgrammaticViewport(function () {
                    /** Set before `setData` so `subscribeVisibleLogicalRangeChange` sees the correct live index. */
                    lastBarLogicalIndexRef.current = lastIdx_1;
                    candleSeries.setData(candles.map(function (c) { return ({
                        time: toUtcTime(c.ts),
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                    }); }));
                    volSeries.setData(candles.map(function (c) {
                        var _a;
                        return ({
                            time: toUtcTime(c.ts),
                            value: (_a = c.volume) !== null && _a !== void 0 ? _a : 0,
                            color: c.close >= c.open ? 'rgba(52,211,153,0.30)' : 'rgba(248,113,113,0.30)',
                        });
                    }));
                    lineSeries.setData([]);
                    if (last_1) {
                        candleStructRef.current = { len: candles.length, lastTs: last_1.ts };
                    }
                    if (!didFitContentRef.current) {
                        ts_1 === null || ts_1 === void 0 ? void 0 : ts_1.fitContent();
                        if (ts_1 &&
                            typeof timeScaleMaxBarSpacingPx === 'number' &&
                            Number.isFinite(timeScaleMaxBarSpacingPx) &&
                            timeScaleMaxBarSpacingPx > 0) {
                            ts_1.applyOptions({ maxBarSpacing: timeScaleMaxBarSpacingPx });
                        }
                        didFitContentRef.current = true;
                        if (!preserveViewport_1 && !lockSetupPriceViewportRef.current) {
                            chart_1 === null || chart_1 === void 0 ? void 0 : chart_1.priceScale('right').setAutoScale(true);
                        }
                        if (!preserveViewport_1 && !skipScrollToRealTimeRef.current) {
                            ts_1 === null || ts_1 === void 0 ? void 0 : ts_1.scrollToRealTime();
                        }
                    }
                    else if (preserveViewport_1 && savedLogical_1 != null && chart_1) {
                        clampVisibleLogicalRange(chart_1, savedLogical_1, lastIdx_1);
                        requestAnimationFrame(function () {
                            applySkipScrollFromViewportRef.current();
                        });
                    }
                    else if (!skipScrollToRealTimeRef.current) {
                        ts_1 === null || ts_1 === void 0 ? void 0 : ts_1.scrollToRealTime();
                        if (!lockSetupPriceViewportRef.current) {
                            chart_1 === null || chart_1 === void 0 ? void 0 : chart_1.priceScale('right').setAutoScale(true);
                        }
                    }
                });
            }
        }
        else {
            candleStructRef.current = null;
            var chart_2 = chartRef.current;
            var ts_2 = chart_2 === null || chart_2 === void 0 ? void 0 : chart_2.timeScale();
            var base_1 = model.lastPrice;
            var plen_1 = model.priceSeries.length;
            if (plen_1 !== lineFallbackSeriesLenRef.current) {
                lineFallbackSeriesLenRef.current = plen_1;
                lineFallbackAnchorSecRef.current = Math.floor(Date.now() / 1000);
            }
            var anchorSec_1 = lineFallbackAnchorSecRef.current;
            var series_1 = model.priceSeries.map(function (v, i) { return ({
                time: (anchorSec_1 - (plen_1 - i) * 60),
                value: base_1 * (0.985 + v * 0.03),
            }); });
            lastBarLogicalIndexRef.current = Math.max(0, series_1.length - 1);
            var lineIsUp = series_1.length >= 2 ? series_1[series_1.length - 1].value >= series_1[0].value : model.lastPrice >= prevPriceRef.current;
            lineSeries.applyOptions({
                color: lineIsUp ? '#34d399' : '#fb7185',
            });
            var preserveViewport_2 = skipScrollToRealTimeRef.current;
            var savedLogical_2 = preserveViewport_2 && chart_2 && ts_2 ? ts_2.getVisibleLogicalRange() : null;
            var lastIdxLine_1 = Math.max(0, series_1.length - 1);
            runProgrammaticViewport(function () {
                lastBarLogicalIndexRef.current = lastIdxLine_1;
                lineSeries.setData(series_1);
                candleSeries.setData([]);
                volSeries.setData([]);
                if (!didFitContentRef.current) {
                    ts_2 === null || ts_2 === void 0 ? void 0 : ts_2.fitContent();
                    if (ts_2 &&
                        typeof timeScaleMaxBarSpacingPx === 'number' &&
                        Number.isFinite(timeScaleMaxBarSpacingPx) &&
                        timeScaleMaxBarSpacingPx > 0) {
                        ts_2.applyOptions({ maxBarSpacing: timeScaleMaxBarSpacingPx });
                    }
                    didFitContentRef.current = true;
                    if (!preserveViewport_2 && !lockSetupPriceViewportRef.current) {
                        chart_2 === null || chart_2 === void 0 ? void 0 : chart_2.priceScale('right').setAutoScale(true);
                    }
                    if (!preserveViewport_2 && !skipScrollToRealTimeRef.current) {
                        ts_2 === null || ts_2 === void 0 ? void 0 : ts_2.scrollToRealTime();
                    }
                }
                else if (preserveViewport_2 && savedLogical_2 != null && chart_2) {
                    clampVisibleLogicalRange(chart_2, savedLogical_2, lastIdxLine_1);
                    requestAnimationFrame(function () {
                        applySkipScrollFromViewportRef.current();
                    });
                }
                else if (!skipScrollToRealTimeRef.current) {
                    ts_2 === null || ts_2 === void 0 ? void 0 : ts_2.scrollToRealTime();
                    if (!lockSetupPriceViewportRef.current) {
                        chart_2 === null || chart_2 === void 0 ? void 0 : chart_2.priceScale('right').setAutoScale(true);
                    }
                }
            });
        }
    }, [
        intervalLabel,
        model.chartCandles,
        model.lastPrice,
        model.pair,
        model.priceSeries,
        runProgrammaticViewport,
        timeScaleMaxBarSpacingPx,
    ]);
    (0, react_1.useEffect)(function () {
        var prev = prevPriceRef.current;
        if (model.lastPrice > prev)
            setPriceDirection('up');
        else if (model.lastPrice < prev)
            setPriceDirection('down');
        else
            setPriceDirection('flat');
        prevPriceRef.current = model.lastPrice;
    }, [model.lastPrice]);
    (0, react_1.useEffect)(function () {
        var _a, _b;
        var candleSeries = candleRef.current;
        var lineSeries = lineRef.current;
        if (!candleSeries || !lineSeries)
            return;
        var candlesActive = ((_b = (_a = model.chartCandles) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
        var host = candlesActive ? candleSeries : lineSeries;
        var nextHostMode = candlesActive ? 'candle' : 'line';
        var prevMode = priceLineHostModeRef.current;
        if (prevMode != null && prevMode !== nextHostMode) {
            var oldHost = prevMode === 'candle' ? candleSeries : lineSeries;
            for (var _i = 0, _c = Object.keys(priceLineByKeyRef.current); _i < _c.length; _i++) {
                var key = _c[_i];
                var pl = priceLineByKeyRef.current[key];
                if (pl)
                    oldHost.removePriceLine(pl);
                delete priceLineByKeyRef.current[key];
            }
            for (var _d = 0, _e = Object.keys(auxPriceLineByIdRef.current); _d < _e.length; _d++) {
                var id = _e[_d];
                var pl = auxPriceLineByIdRef.current[id];
                if (pl)
                    oldHost.removePriceLine(pl);
                delete auxPriceLineByIdRef.current[id];
            }
        }
        priceLineHostModeRef.current = nextHostMode;
        var want = new Set(visibleLevelKeys);
        for (var _f = 0, _g = Object.keys(priceLineByKeyRef.current); _f < _g.length; _f++) {
            var key = _g[_f];
            if (!want.has(key)) {
                var line = priceLineByKeyRef.current[key];
                if (line)
                    host.removePriceLine(line);
                delete priceLineByKeyRef.current[key];
            }
        }
        var strokeFor = function (key) {
            var style = levelStyles[key];
            if (usePremiumTradeZones && key === 'stop')
                return '#fecaca';
            if (usePremiumTradeZones && key === 'entry')
                return 'rgba(45,212,191,0.95)';
            if (usePremiumTradeZones && key === 'target')
                return 'rgba(74,222,128,0.88)';
            if (useTimedSetupOverlays) {
                var a = (0, tradeTimingChip_1.tradeTimingLineAlpha)(key, setupOverlayVisual.alphaScale);
                return (0, chartColorUtils_1.hexToRgba)(style.stroke, a);
            }
            if (setupFocusPulse && (key === 'entry' || key === 'stop' || key === 'target')) {
                return (0, chartColorUtils_1.hexToRgba)(style.stroke, 0.95);
            }
            return style.stroke;
        };
        var widthFor = function (key) {
            if (usePremiumTradeZones && (key === 'entry' || key === 'stop' || key === 'target')) {
                if (key === 'stop')
                    return 4;
                if (key === 'entry')
                    return 2;
                return 1;
            }
            if (setupFocusPulse && (key === 'entry' || key === 'stop' || key === 'target')) {
                return (key === 'entry' ? 3 : 2);
            }
            if (key !== 'entry')
                return 1;
            var w = 2 + (useTimedSetupOverlays ? setupOverlayVisual.entryLineExtraWidth : 0);
            return (w <= 4 ? w : 4);
        };
        for (var _h = 0, visibleLevelKeys_1 = visibleLevelKeys; _h < visibleLevelKeys_1.length; _h++) {
            var key = visibleLevelKeys_1[_h];
            var style = levelStyles[key];
            var price = staticLevelPrices[key];
            if (!Number.isFinite(price) || price <= 0) {
                var ghost = priceLineByKeyRef.current[key];
                if (ghost) {
                    host.removePriceLine(ghost);
                    delete priceLineByKeyRef.current[key];
                }
                continue;
            }
            var existing = priceLineByKeyRef.current[key];
            var premiumPlan = usePremiumTradeZones && key !== 'liquidation';
            /** Native LC lines sit under `TradePlanZonesOverlay`; hiding them avoids a thin “dotted” double line under the HTML bars. */
            var lineVisible = !premiumPlan;
            if (existing) {
                existing.applyOptions({
                    price: price,
                    color: strokeFor(key),
                    lineWidth: widthFor(key),
                    lineStyle: lightweight_charts_1.LineStyle.Solid,
                    lineVisible: lineVisible,
                    title: premiumPlan ? '' : style.label,
                    axisLabelVisible: !premiumPlan,
                });
            }
            else {
                priceLineByKeyRef.current[key] = host.createPriceLine({
                    price: price,
                    color: strokeFor(key),
                    lineWidth: widthFor(key),
                    lineStyle: lightweight_charts_1.LineStyle.Solid,
                    lineVisible: lineVisible,
                    axisLabelVisible: !premiumPlan,
                    title: premiumPlan ? '' : style.label,
                });
            }
        }
    }, [
        model.chartCandles,
        staticLevelPrices,
        visibleLevelKeys,
        useTimedSetupOverlays,
        setupOverlayVisual,
        setupFocusPulse,
        usePremiumTradeZones,
    ]);
    (0, react_1.useEffect)(function () {
        var _a, _b;
        var candleSeries = candleRef.current;
        var lineSeries = lineRef.current;
        if (!candleSeries || !lineSeries)
            return;
        var candlesActive = ((_b = (_a = model.chartCandles) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
        var host = candlesActive ? candleSeries : lineSeries;
        var want = new Map((auxiliaryPriceLines !== null && auxiliaryPriceLines !== void 0 ? auxiliaryPriceLines : []).filter(function (a) { return Number.isFinite(a.price) && a.price > 0; }).map(function (a) { return [a.id, a]; }));
        for (var _i = 0, _c = Object.keys(auxPriceLineByIdRef.current); _i < _c.length; _i++) {
            var id = _c[_i];
            if (!want.has(id)) {
                var pl = auxPriceLineByIdRef.current[id];
                if (pl)
                    host.removePriceLine(pl);
                delete auxPriceLineByIdRef.current[id];
            }
        }
        for (var _d = 0, _e = want.values(); _d < _e.length; _d++) {
            var aux = _e[_d];
            var existing = auxPriceLineByIdRef.current[aux.id];
            if (existing) {
                existing.applyOptions({
                    price: aux.price,
                    color: aux.color,
                    title: aux.title,
                });
            }
            else {
                auxPriceLineByIdRef.current[aux.id] = host.createPriceLine({
                    price: aux.price,
                    color: aux.color,
                    lineWidth: 1,
                    axisLabelVisible: true,
                    title: aux.title,
                });
            }
        }
    }, [auxiliaryPriceLines, model.chartCandles, model.lastPrice]);
    var viewportRefitSeenKeyRef = (0, react_1.useRef)(undefined);
    var viewportRefitCompositeKey = [liveTradeRefitKey, chartViewportSnapKey].filter(function (k) { return typeof k === 'string' && k.length > 0; }).join('\u0000');
    (0, react_1.useEffect)(function () {
        if (!viewportRefitCompositeKey) {
            viewportRefitSeenKeyRef.current = undefined;
            return;
        }
        if (viewportRefitSeenKeyRef.current === viewportRefitCompositeKey)
            return;
        viewportRefitSeenKeyRef.current = viewportRefitCompositeKey;
        didFitContentRef.current = false;
        skipScrollToRealTimeRef.current = false;
        lockSetupPriceViewportRef.current = false;
        var id = window.requestAnimationFrame(function () {
            var chart = chartRef.current;
            if (!chart)
                return;
            runProgrammaticViewport(function () {
                var ts = chart.timeScale();
                ts.fitContent();
                if (typeof timeScaleMaxBarSpacingPx === 'number' &&
                    Number.isFinite(timeScaleMaxBarSpacingPx) &&
                    timeScaleMaxBarSpacingPx > 0) {
                    ts.applyOptions({ maxBarSpacing: timeScaleMaxBarSpacingPx });
                }
                didFitContentRef.current = true;
                chart.priceScale('right').setAutoScale(true);
                ts.scrollToRealTime();
            });
        });
        return function () { return window.cancelAnimationFrame(id); };
    }, [viewportRefitCompositeKey, runProgrammaticViewport, timeScaleMaxBarSpacingPx]);
    (0, react_1.useEffect)(function () {
        if (!setupControlled || setupMode)
            return;
        var setupKeys = __spreadArray(['entry', 'stop', 'target'], (showLiquidation ? ['liquidation'] : []), true).filter(function (k) { return priceLineByKeyRef.current[k]; });
        var easeOut = function (t) { return 1 - (1 - t) * (1 - t); };
        if (setupKeys.length === 0) {
            setVisibleLevels(function (p) { return (__assign(__assign({}, p), { entry: false, stop: false, target: false, liquidation: false })); });
            return;
        }
        var raf = 0;
        var cancelled = false;
        var start = performance.now();
        var cap = lastSetupAlphaScaleRef.current;
        var step = function (now) {
            if (cancelled)
                return;
            var p = Math.min(1, (now - start) / SETUP_LINE_ANIM_MS);
            var alpha = easeOut(1 - p) * cap;
            for (var _i = 0, setupKeys_1 = setupKeys; _i < setupKeys_1.length; _i++) {
                var key = setupKeys_1[_i];
                var line = priceLineByKeyRef.current[key];
                if (line)
                    line.applyOptions({ color: (0, chartColorUtils_1.hexToRgba)(levelStyles[key].stroke, alpha) });
            }
            if (p < 1) {
                raf = requestAnimationFrame(step);
            }
            else if (!setupModeLiveRef.current) {
                setVisibleLevels(function (prev) { return (__assign(__assign({}, prev), { entry: false, stop: false, target: false, liquidation: false })); });
            }
        };
        raf = requestAnimationFrame(step);
        return function () {
            cancelled = true;
            cancelAnimationFrame(raf);
        };
    }, [setupMode, showLiquidation, setupControlled]);
    (0, react_1.useEffect)(function () {
        if (!setupControlled || !setupMode)
            return;
        if (!setupFadeInArmRef.current)
            return;
        var keys = __spreadArray(['entry', 'stop', 'target'], (showLiquidation ? ['liquidation'] : []), true).filter(function (k) { return visibleLevels[k]; });
        if (keys.length === 0)
            return;
        setupFadeInArmRef.current = false;
        var cancelled = false;
        var raf = 0;
        var easeOut = function (t) { return 1 - (1 - t) * (1 - t); };
        var cap = useTimedSetupOverlays ? setupOverlayVisual.alphaScale : 1;
        var run = function () {
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                var line = priceLineByKeyRef.current[key];
                if (line)
                    line.applyOptions({ color: (0, chartColorUtils_1.hexToRgba)(levelStyles[key].stroke, 0) });
            }
            var start = performance.now();
            var step = function (now) {
                if (cancelled)
                    return;
                var p = Math.min(1, (now - start) / SETUP_LINE_ANIM_MS);
                var t = easeOut(p);
                for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                    var key = keys_2[_i];
                    var line = priceLineByKeyRef.current[key];
                    if (line) {
                        var stroke = levelStyles[key].stroke;
                        var peak = !useTimedSetupOverlays ? 1 : (0, tradeTimingChip_1.tradeTimingLineAlpha)(key, cap);
                        line.applyOptions({ color: (0, chartColorUtils_1.hexToRgba)(stroke, t * peak) });
                    }
                }
                if (p < 1) {
                    raf = requestAnimationFrame(step);
                }
                else {
                    for (var _a = 0, keys_3 = keys; _a < keys_3.length; _a++) {
                        var key = keys_3[_a];
                        var line = priceLineByKeyRef.current[key];
                        if (line) {
                            var stroke = levelStyles[key].stroke;
                            var endAlpha = !useTimedSetupOverlays ? 1 : (0, tradeTimingChip_1.tradeTimingLineAlpha)(key, cap);
                            line.applyOptions({
                                color: !useTimedSetupOverlays ? stroke : (0, chartColorUtils_1.hexToRgba)(stroke, endAlpha),
                            });
                        }
                    }
                }
            };
            raf = requestAnimationFrame(step);
        };
        var id = requestAnimationFrame(function () { return requestAnimationFrame(run); });
        return function () {
            cancelled = true;
            cancelAnimationFrame(raf);
            cancelAnimationFrame(id);
        };
    }, [
        setupMode,
        visibleLevelKeys,
        showLiquidation,
        setupControlled,
        useTimedSetupOverlays,
        setupOverlayVisual.alphaScale,
    ]);
    (0, react_1.useEffect)(function () {
        var vol = volRef.current;
        if (!vol)
            return;
        vol.applyOptions({ visible: showVolume });
    }, [showVolume]);
    var change = change24hPct != null && Number.isFinite(change24hPct) ? change24hPct : (_e = model.change24hPct) !== null && _e !== void 0 ? _e : 0;
    var changeClass = change >= 0 ? 'text-emerald-400' : 'text-rose-400';
    var abs24hUsd = change !== 0 && Number.isFinite(model.lastPrice) ? (model.lastPrice * change) / (100 + change) : 0;
    var abs24hFmt = (0, formatQuote_1.formatQuoteNumber)(Math.abs(abs24hUsd));
    var marketTag = market === 'spot'
        ? "Spot".concat(showTimeframeBar ? '' : " \u00B7 ".concat(intervalLabel !== null && intervalLabel !== void 0 ? intervalLabel : '5m'))
        : showTimeframeBar
            ? null
            : (intervalLabel !== null && intervalLabel !== void 0 ? intervalLabel : '5m');
    var perpTimeCluster = (<span className="inline-flex shrink-0 flex-col items-end gap-0 leading-none">
      {marketTag ? (<span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted/90 md:text-[11px]">
          {marketTag}
        </span>) : null}
      {liveTime ? (<span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-200/90 md:text-[11px]">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-300"/>
          <span className="tabular-nums leading-tight">{liveTime}</span>
        </span>) : null}
      {loadingInterval ? (<span className="mt-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-200">
          <svg viewBox="0 0 24 24" className="h-2 w-2 animate-spin" fill="none" aria-label="Loading interval">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.35"/>
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>) : null}
    </span>);
    /** Clean mode: overlay chips still click — first tap turns on Setup so levels can render. */
    var setupGated = setupControlled && !setupMode;
    var chartFrameToneClass = chartProximity === 'stop'
        ? 'shadow-[inset_0_0_20px_-8px_rgba(248,113,113,0.35)]'
        : chartProximity === 'target'
            ? 'shadow-[inset_0_0_20px_-8px_rgba(74,222,128,0.22)]'
            : '';
    var showPairTfHero = Boolean(heroPairLabel) &&
        showTimeframeBar &&
        Boolean(timeframeOptions && chartInterval != null && onChartIntervalChange);
    /**
     * Price + TF header rows render inside the chart panel (not in the padded card body) so quotes sit flush
     * above the plot — applies to the trade dock (`exchangeStyleHero`) and manage (`heroPairLabel`) charts.
     */
    var headerDockedInPlotPanel = showTimeframeBar && (exchangeStyleHero || Boolean(heroPairLabel));
    /** Manage dock: show Stop/Tgt/R:R in the header above TF chips instead of on the plot (clears scale clutter). */
    var dockTradePlanCornerStatsInHeader = premiumZonesVisible && headerDockedInPlotPanel && !exchangeStyleHero && Boolean(heroPairLabel);
    var pairTfHeroTfChips = (<div ref={heroTfScrollRef} className="flex min-w-0 max-w-full justify-end overflow-x-auto overscroll-x-contain py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x">
      <div className="inline-flex min-w-max shrink-0 items-center gap-1 sm:gap-1.5">
        <span className="hidden shrink-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted/80 sm:inline sm:text-[9px] md:text-[10px]">
          TF
        </span>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {timeframeOptions.map(function (intv) { return (<button key={intv.value} ref={chartInterval === intv.value ? heroTfActiveChipRef : undefined} type="button" onClick={function () { return onChartIntervalChange(intv.value); }} className={"shrink-0 rounded-md px-1.5 py-1 text-[9px] font-bold leading-none transition sm:px-2 sm:py-1.5 sm:text-[10px] md:px-2.5 md:text-[11px] ".concat(chartInterval === intv.value
                ? 'bg-sigflo-accent/18 text-sigflo-accent ring-1 ring-inset ring-sigflo-accent/35'
                : 'border border-white/[0.06] bg-white/[0.04] text-sigflo-muted hover:border-white/[0.1] hover:text-sigflo-text')}>
              {intv.label}
            </button>); })}
        </div>
      </div>
    </div>);
    var pairTfHeroTfStrip = (<div className="order-last flex w-full min-w-0 justify-end border-t border-white/[0.06] pt-1">
      {pairTfHeroTfChips}
    </div>);
    var pairTfHeroQuoteCluster = (<div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight md:gap-x-2">
      <h2 className="max-w-[min(100%,40vw)] truncate text-xs font-bold tracking-tight text-white sm:max-w-[12rem] md:max-w-none md:text-xl">
        {heroPairLabel}
      </h2>
      <span className={"shrink-0 text-sm font-bold tabular-nums leading-none transition-colors md:text-2xl ".concat(priceDirection === 'up' ? 'text-emerald-200' : priceDirection === 'down' ? 'text-rose-200' : 'text-white')}>
        {(0, formatQuote_1.formatQuoteUsd)(model.lastPrice)}
      </span>
      <span className={"shrink-0 text-[10px] font-bold tabular-nums leading-none md:text-sm ".concat(changeClass)}>
        {change >= 0 ? '+' : ''}
        {change.toFixed(2)}%
      </span>
    </div>);
    var pairTfHeroQuoteRow = (<div className={"flex w-full min-w-0 items-start justify-between gap-2 ".concat(headerDockedInPlotPanel ? 'shrink-0 py-1' : 'pt-0')}>
      {pairTfHeroQuoteCluster}
      {dockTradePlanCornerStatsInHeader ? null : (<div className="shrink-0 border-l border-white/[0.08] pl-1.5 md:pl-2">{perpTimeCluster}</div>)}
    </div>);
    /** Manage dock + premium zones: pair / price / % on the same row as Stop·Tgt·R:R and live time. */
    var pairTfHeroDockedQuoteStatsTimeRow = (<div className="flex w-full min-w-0 shrink-0 items-start justify-between gap-2 py-1">
      {pairTfHeroQuoteCluster}
      <div className="flex shrink-0 items-start justify-end gap-2">
        <div className="pointer-events-none shrink-0">
          <TradePlanCornerStats_1.TradePlanCornerStats entry={model.entry} stop={model.stop} target={model.target} lastPrice={model.lastPrice} riskReward={model.riskReward} className="max-w-[min(100%,11rem)] shrink-0"/>
        </div>
        <div className="pointer-events-none shrink-0">{perpTimeCluster}</div>
      </div>
    </div>);
    var pairTfHeroPnlRow = pnlHeaderLabel != null && pnlHeaderLabel !== '' ? (<div className={"flex w-full min-w-0 ".concat(headerDockedInPlotPanel ? 'shrink-0 pb-1 pt-0' : '')}>
        <p className={"max-w-full truncate text-[9px] font-semibold tabular-nums leading-tight sm:text-[10px] md:text-[11px] ".concat(pnlHeaderToneClass)}>
          {pnlHeaderLabel}
        </p>
      </div>) : null;
    /** Manage dock: PnL + TF chips share one row above the plot. */
    var pairTfHeroDockedPnlTfRow = (<div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-2 py-1">
      <div className="min-w-0 flex-1">
        {pnlHeaderLabel != null && pnlHeaderLabel !== '' ? (<p className={"max-w-full truncate text-[9px] font-semibold tabular-nums leading-tight sm:text-[10px] md:text-[11px] ".concat(pnlHeaderToneClass)}>
            {pnlHeaderLabel}
          </p>) : null}
      </div>
      <div className="flex min-w-0 max-w-[min(100%,11.5rem)] shrink-0 items-center sm:max-w-[min(100%,16rem)] md:max-w-none">
        {pairTfHeroTfChips}
      </div>
      {chartInnerChromeToggle && !exchangeStyleHero ? (<button type="button" onClick={chartInnerChromeToggle.onToggle} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.05] text-sigflo-muted transition hover:border-cyan-400/35 hover:text-cyan-100 active:scale-[0.97] md:h-7 md:w-7" aria-label={chartInnerChromeToggle.variant === 'immersive'
                ? chartInnerChromeToggle.expanded
                    ? 'Exit full chart'
                    : 'Expand to full chart'
                : chartInnerChromeToggle.expanded
                    ? 'Minimize chart'
                    : 'Maximize chart'} title={chartInnerChromeToggle.variant === 'immersive'
                ? chartInnerChromeToggle.expanded
                    ? 'Exit full chart'
                    : 'Full chart'
                : chartInnerChromeToggle.expanded
                    ? 'Minimize chart'
                    : 'Maximize chart'}>
          {chartInnerChromeToggle.variant === 'immersive' ? (chartInnerChromeToggle.expanded ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>)) : chartInnerChromeToggle.expanded ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>)}
        </button>) : null}
    </div>);
    var pairTfHeroContent = showPairTfHero ? (<div className={"flex w-full min-w-0 flex-col border-b border-[#00ffc8]/28 ".concat(headerDockedInPlotPanel
            ? 'shrink-0 divide-y divide-[#00ffc8]/18 px-[4.5px] pb-0 pt-1 md:px-[5.5px] md:pt-1.5'
            : 'mb-0 gap-0 pb-px md:gap-0.5 md:pb-0.5')}>
      {headerDockedInPlotPanel ? (<>
          {dockTradePlanCornerStatsInHeader ? pairTfHeroDockedQuoteStatsTimeRow : pairTfHeroQuoteRow}
          {pairTfHeroDockedPnlTfRow}
        </>) : (<>
          {pairTfHeroTfStrip}
          {pairTfHeroQuoteRow}
          {pairTfHeroPnlRow}
        </>)}
    </div>) : null;
    var showExchangeTfHeader = exchangeStyleHero &&
        showTimeframeBar &&
        Boolean(timeframeOptions && chartInterval != null && onChartIntervalChange);
    /** Trade dock: one bar above the plot — price/PnL left, TF + chrome right. */
    var exchangeTfHeaderSingleRowDocked = headerDockedInPlotPanel && !immersiveTfHero;
    var exchangeTfControlsRow = (<div className={"".concat(exchangeTfHeaderSingleRowDocked ? '' : 'ml-auto ', "flex min-w-0 max-w-full shrink-0 items-end justify-end gap-x-1 gap-y-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-x-1.5 md:gap-y-1")}>
      <div className="flex w-max shrink-0 flex-nowrap items-end justify-end gap-1 md:gap-1.5">
        {timeframeOptions.map(function (intv) { return (<button key={intv.value} type="button" onClick={function () { return onChartIntervalChange(intv.value); }} className={"shrink-0 rounded px-[6px] py-[3px] text-[8px] font-medium uppercase leading-none tracking-wide transition md:px-2 md:py-1 md:text-[9px] ".concat(chartInterval === intv.value
                ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25'
                : 'bg-white/[0.04] text-sigflo-muted hover:bg-white/[0.07] hover:text-sigflo-text')}>
            {intv.label}
          </button>); })}
      </div>
      {onSetupModeToggle ? (<div className="shrink-0">
          <SetupToggle_1.SetupToggle isActive={setupMode === true} onToggle={onSetupModeToggle}/>
        </div>) : null}
      <span className="h-3 w-px shrink-0 bg-white/[0.12]" aria-hidden/>
      <div className="flex shrink-0 items-end pb-px">{perpTimeCluster}</div>
      {chartInnerChromeToggle ? (<button type="button" onClick={chartInnerChromeToggle.onToggle} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.05] text-sigflo-muted transition hover:border-cyan-400/35 hover:text-cyan-100 active:scale-[0.97] md:h-7 md:w-7" aria-label={chartInnerChromeToggle.variant === 'immersive'
                ? chartInnerChromeToggle.expanded
                    ? 'Exit full chart'
                    : 'Expand to full chart'
                : chartInnerChromeToggle.expanded
                    ? 'Minimize chart'
                    : 'Maximize chart'} title={chartInnerChromeToggle.variant === 'immersive'
                ? chartInnerChromeToggle.expanded
                    ? 'Exit full chart'
                    : 'Full chart'
                : chartInnerChromeToggle.expanded
                    ? 'Minimize chart'
                    : 'Maximize chart'}>
          {chartInnerChromeToggle.variant === 'immersive' ? (chartInnerChromeToggle.expanded ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>)) : chartInnerChromeToggle.expanded ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>)}
        </button>) : null}
    </div>);
    var exchangePricePnlStack = (<div className={immersiveTfHero
            ? 'flex min-h-0 min-w-0 shrink-0 flex-col justify-end gap-0.5 self-stretch'
            : exchangeTfHeaderSingleRowDocked
                ? 'flex min-w-0 min-h-0 flex-1 flex-col items-start justify-end gap-0.5 overflow-hidden'
                : 'flex min-w-0 shrink-0 flex-col justify-end gap-0.5'}>
      <div className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2 gap-y-0">
        <span className={"text-xs font-bold tabular-nums leading-none transition-colors md:text-sm ".concat(priceDirection === 'up'
            ? 'text-emerald-200'
            : priceDirection === 'down'
                ? 'text-rose-200'
                : 'text-white')}>
          {Number.isFinite(model.lastPrice) && model.lastPrice > 0 ? (0, formatQuote_1.formatQuoteUsd)(model.lastPrice) : '—'}
        </span>
        <span className={"text-[7px] font-medium tabular-nums leading-tight md:text-[8px] ".concat(changeClass)}>
          {change >= 0 ? '+' : '−'}
          {abs24hFmt} ({change >= 0 ? '+' : ''}
          {change.toFixed(2)}%)
        </span>
      </div>
      {suppressExchangeHeroLivePrice && (liveHeaderMetrics === null || liveHeaderMetrics === void 0 ? void 0 : liveHeaderMetrics.secondaryLine) ? (<p className={"w-full min-w-0 max-w-[min(100%,16rem)] shrink-0 truncate text-left leading-tight text-[7px] font-semibold tabular-nums md:text-[8px] ".concat(liveHeaderMetrics.secondaryLineTone === 'positive'
                ? 'text-emerald-300'
                : liveHeaderMetrics.secondaryLineTone === 'negative'
                    ? 'text-rose-300'
                    : 'text-sigflo-muted')}>
          {liveHeaderMetrics.secondaryLine}
        </p>) : null}
    </div>);
    var renderExchangeTfHeaderBlock = function () { return (<>
      {headerDockedInPlotPanel && !immersiveTfHero ? (<div className={"shrink-0 flex min-w-0 w-full border-b bg-[rgb(12,12,15)] ".concat(suppressExchangeHeroLivePrice && liveTradeMode ? 'border-[#00ffc8]/12' : 'border-white/[0.06]', " ").concat(chartPlotFlexFill ? 'shrink-0' : '')}>
          <div className="flex w-full min-w-0 items-end justify-between gap-2 px-[4.5px] pb-1 pt-1 md:px-[5.5px] md:pt-1.5">
            {exchangePricePnlStack}
            {exchangeTfControlsRow}
          </div>
        </div>) : (<div className={"shrink-0 flex min-w-0 w-full justify-between gap-x-2 border-b bg-[rgb(12,12,15)] md:gap-x-2.5 ".concat(immersiveTfHero
                ? 'flex-wrap items-stretch gap-y-1 px-[4.5px] pb-1 pt-0 md:px-[5.5px] md:pb-1.5 md:pt-0'
                : 'flex-wrap items-end gap-y-1 px-[4.5px] pb-[3px] pt-1.5 md:px-[5.5px] md:pb-[3.5px] md:pt-2', " ").concat(chartPlotFlexFill ? 'shrink-0' : '', " ").concat(suppressExchangeHeroLivePrice && liveTradeMode
                ? 'border-[#00ffc8]/12'
                : 'border-white/[0.06]')}>
          {exchangePricePnlStack}
          {exchangeTfControlsRow}
        </div>)}
      {liveTradeMode && liveHeaderMetrics && !suppressExchangeHeroLivePrice ? (<div className={"shrink-0 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#00ffc8]/12 bg-gradient-to-r from-[#00ffc8]/[0.06] via-black/20 to-transparent px-[4.5px] py-[4px] md:px-[5.5px] ".concat(chartPlotFlexFill ? 'shrink-0' : '')}>
          <span className="text-[6px] font-extrabold uppercase tracking-[0.14em] text-[#7ee8d3]/90 md:text-[7px]">
            {liveActivePositionTitle}
          </span>
          <span className="text-[7px] font-medium tabular-nums text-sigflo-muted md:text-[8px]">
            Risk{' '}
            <span className="text-rose-200/90">{liveHeaderMetrics.riskPercent.toFixed(1)}%</span>
            <span className="text-sigflo-muted/60"> · </span>
            Target{' '}
            <span className="text-emerald-200/90">{liveHeaderMetrics.rewardPercent.toFixed(1)}%</span>
            <span className="text-sigflo-muted/60"> · </span>
            R:R{' '}
            <span className="text-white/90">
              {Number.isFinite(liveHeaderMetrics.rrRatio) && liveHeaderMetrics.rrRatio > 0
                ? liveHeaderMetrics.rrRatio.toFixed(1)
                : '—'}
            </span>
          </span>
          {liveHeaderMetrics.badge ? (<span className="rounded border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-px text-[6px] font-bold uppercase tracking-wide text-cyan-100/95 md:text-[7px]">
              {liveHeaderMetrics.badge}
            </span>) : null}
        </div>) : null}
    </>); };
    return (<Card_1.Card panelTexture={false} className={"min-w-0 overflow-hidden border-cyan-400/35 bg-gradient-to-b from-[#14141a] via-[#0e0e12] to-[#0c0c0f] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.9)] ".concat(immersiveTfHero ? 'px-1.5 pb-1.5 pt-1 md:px-2 md:pb-2 md:pt-1.5' : headerDockedInPlotPanel
            ? 'px-1.5 pb-1.5 pt-0 md:px-2 md:pb-2 md:pt-0'
            : 'p-1.5 md:p-2', " ").concat(chartPlotFlexFill ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col' : '', " ").concat(liveTradeMode ? 'ring-1 ring-[#00ffc8]/14 shadow-[0_0_48px_-28px_rgba(0,255,200,0.12)]' : '')} style={_b = {}, _b['--chart-h-desktop'] = "".concat(chartHeightPx, "px"), _b}>
      {showExchangeTfHeader ? null : heroPairLabel ? (headerDockedInPlotPanel && !exchangeStyleHero ? null : pairTfHeroContent ? (pairTfHeroContent) : (<div className="mb-1 flex items-start justify-between gap-1.5 md:mb-3 md:gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xs font-bold tracking-tight text-white md:text-xl">{heroPairLabel}</h2>
              <div className="mt-0 flex flex-wrap items-baseline gap-1 md:mt-1 md:gap-2">
                <span className={"text-sm font-bold tabular-nums leading-tight transition-colors md:text-2xl ".concat(priceDirection === 'up' ? 'text-emerald-200' : priceDirection === 'down' ? 'text-rose-200' : 'text-white')}>
                  {(0, formatQuote_1.formatQuoteUsd)(model.lastPrice)}
                </span>
                <span className={"text-[11px] font-bold tabular-nums md:text-sm ".concat(changeClass)}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </span>
              </div>
              {pnlHeaderLabel ? (<p className={"mt-0.5 text-[10px] font-semibold tabular-nums md:text-[11px] ".concat(pnlHeaderToneClass)}>
                  {pnlHeaderLabel}
                </p>) : null}
            </div>
            <div className="shrink-0 text-right">{perpTimeCluster}</div>
          </div>)) : exchangeStyleHero && metaCaption ? (<div className="mb-0 space-y-0">
          <p className={"text-xl font-bold tabular-nums md:text-2xl ".concat(priceDirection === 'up' ? 'text-emerald-200' : priceDirection === 'down' ? 'text-rose-200' : 'text-white')}>
            {(0, formatQuote_1.formatQuoteUsd)(model.lastPrice)}
          </p>
          <p className={"mt-0.5 text-xs font-semibold tabular-nums leading-tight md:text-sm ".concat(changeClass)}>
            {change >= 0 ? '+' : '−'}
            {abs24hFmt} ({change >= 0 ? '+' : ''}
            {change.toFixed(2)}%)
          </p>
        </div>) : (<div className="flex items-center justify-between md:py-0">
          <h2 className={"text-xs font-semibold transition-colors md:text-sm ".concat(priceDirection === 'up' ? 'text-emerald-300' : priceDirection === 'down' ? 'text-rose-300' : 'text-white')}>
            {(0, formatQuote_1.formatQuoteUsd)(model.lastPrice)}
          </h2>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] text-sigflo-muted md:text-[11px]">
              Live{showTimeframeBar ? '' : " ".concat(intervalLabel !== null && intervalLabel !== void 0 ? intervalLabel : '5m')} + overlays
              {liveTime ? (<span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300"/>
                  {liveTime}
                </span>) : null}
              {loadingInterval ? (<span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-200">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin" fill="none" aria-label="Loading interval">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.35"/>
                    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>) : null}
            </span>
          </div>
        </div>)}
      {exchangeStyleHero &&
            metaCaption &&
            !(showTimeframeBar && timeframeOptions && chartInterval != null && onChartIntervalChange) ? (<p className="mt-0 border-b border-white/[0.06] bg-[rgb(12,12,15)] px-2 py-1 text-[9px] font-medium leading-snug tracking-wide text-sigflo-muted/75 md:px-2.5 md:py-1 md:text-[10px]">
          {metaCaption}
        </p>) : null}
      <div className={"mt-0 min-h-0 overflow-hidden transition-[box-shadow] duration-500 ".concat(chartPlotFlexFill || headerDockedInPlotPanel ? 'flex min-h-0 min-w-0 flex-1 flex-col' : '', " ").concat(headerDockedInPlotPanel || !exchangeTfHero
            ? 'rounded-lg border border-white/[0.08] bg-[rgb(12,12,15)] md:rounded-xl'
            : 'rounded-t-none rounded-b-lg border border-t-0 border-white/[0.08] bg-[rgb(12,12,15)] md:rounded-b-xl', " ").concat(chartFrameToneClass, " ").concat(setupFocusPulse ? 'sigflo-chart-setup-focus-pulse' : '')}>
        {showExchangeTfHeader ? renderExchangeTfHeaderBlock() : null}
        {headerDockedInPlotPanel && !exchangeStyleHero ? pairTfHeroContent : null}
        <div className={chartPlotFlexFill
            ? 'relative isolate z-0 min-h-0 w-full min-w-0 flex-1 basis-0 overflow-hidden bg-[rgb(12,12,15)]'
            : chartPlotHeightPx != null
                ? 'relative isolate z-0 w-full shrink-0 overflow-hidden bg-[rgb(12,12,15)] transition-[height] duration-300 ease-out'
                : 'relative isolate z-0 h-[20dvh] min-h-[72px] max-h-[20dvh] w-full shrink-0 overflow-hidden bg-[rgb(12,12,15)] md:h-[var(--chart-h-desktop)] md:max-h-none md:min-h-[200px]'} style={chartPlotFlexFill
            ? undefined
            : chartPlotHeightPx != null
                ? { height: chartPlotHeightPx, minHeight: chartPlotHeightPx }
                : undefined} onPointerDown={function (e) {
            if (e.button !== 0)
                return;
            pricePanPrimedRef.current = { x: e.clientX, y: e.clientY };
        }} onPointerMoveCapture={function (e) {
            var _a;
            var start = pricePanPrimedRef.current;
            if (!start)
                return;
            if (e.pointerType === 'mouse' && e.buttons === 0)
                return;
            var dx = e.clientX - start.x;
            var dy = e.clientY - start.y;
            if (dx * dx + dy * dy < 9)
                return;
            pricePanPrimedRef.current = null;
            (_a = chartRef.current) === null || _a === void 0 ? void 0 : _a.priceScale('right').setAutoScale(false);
        }} onPointerUp={function () {
            pricePanPrimedRef.current = null;
        }} onPointerCancel={function () {
            pricePanPrimedRef.current = null;
        }} onPointerLeave={function () {
            pricePanPrimedRef.current = null;
            skipScrollToRealTimeRef.current = true;
        }} onPointerEnter={function () {
            applySkipScrollFromViewportRef.current();
        }}>
          {/*
          Plot inset: docked manage hero sits above this wrapper; otherwise `top-px` avoids subpixel shear
          from `overflow-hidden` ancestors (LC uses devicePixelRatio).
        */}
          <div ref={bindChartPlotEl} className={"absolute inset-x-0 bottom-0 z-[1] bg-[#0c0c0f] ".concat(headerDockedInPlotPanel ? 'top-0' : 'top-px')}/>
          {usePremiumTradeZones ? (<div className={"pointer-events-none absolute inset-x-0 bottom-0 z-20 overflow-hidden ".concat(headerDockedInPlotPanel ? 'top-0' : 'top-px')}>
              <TradePlanZonesOverlay_1.TradePlanZonesOverlay plotEl={chartPlotMountEl} chartRef={chartRef} candleSeriesRef={candleRef} lineSeriesRef={lineRef} candlesActive={candlesActiveOverlay} chartGen={tradePlanChartGen} side={model.side} entry={model.entry} stop={model.stop} target={model.target} lastPrice={model.lastPrice} riskReward={model.riskReward} visibleEntry={visibleLevels.entry} visibleStop={visibleLevels.stop} visibleTarget={visibleLevels.target} focusPulse={setupFocusPulse} exitZoneMode={tradePlanExitLabel} showCornerStats={!dockTradePlanCornerStatsInHeader}/>
            </div>) : null}
          {usePremiumTradeZones &&
            draggablePlanLevels &&
            (onPlanStopChange != null ||
                onPlanTargetChange != null ||
                onPlanStopDragEnd != null ||
                onPlanTargetDragEnd != null) ? (<div className={"pointer-events-none absolute inset-x-0 bottom-0 z-[38] overflow-hidden ".concat(headerDockedInPlotPanel ? 'top-0' : 'top-px')}>
              <TradePlanDragHandles_1.TradePlanDragHandles plotEl={chartPlotMountEl} chartRef={chartRef} candleSeriesRef={candleRef} lineSeriesRef={lineRef} candlesActive={candlesActiveOverlay} chartGen={tradePlanChartGen} stop={model.stop} target={model.target} visibleStop={visibleLevels.stop} visibleTarget={visibleLevels.target} onStopChange={onPlanStopChange} onTargetChange={onPlanTargetChange} onStopDragEnd={onPlanStopDragEnd} onTargetDragEnd={onPlanTargetDragEnd}/>
            </div>) : null}
        </div>
        <div className={"relative z-10 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-white/[0.06] bg-[rgb(12,12,15)] px-[4.5px] py-[3.5px] md:gap-x-2.5 md:px-[5.5px] md:py-[4.5px] ".concat(chartPlotFlexFill ? 'shrink-0' : '')}>
          <div className="relative z-10 flex min-w-0 flex-wrap items-center gap-[3.5px] text-[7px] font-medium leading-tight md:gap-[4.5px] md:text-[8px]">
            <button type="button" onClick={function () { return setShowVolume(function (v) { return !v; }); }} className={"rounded-sm px-[5.5px] py-[3.5px] transition md:px-[7px] md:py-[3px] ".concat(showVolume
            ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30'
            : 'bg-white/[0.04] text-sigflo-muted')} aria-pressed={showVolume} aria-label="Toggle volume bars">
              Vol
            </button>
            {Object.keys(levelStyles)
            .filter(function (key) { return (key === 'liquidation' ? showLiquidation : true); })
            .map(function (key) { return (<button key={key} type="button" onClick={function () {
                if (setupGated) {
                    setSoloOverlayFromClean(key);
                    if (onRequestSetupMode)
                        onRequestSetupMode();
                    else
                        onSetupModeToggle === null || onSetupModeToggle === void 0 ? void 0 : onSetupModeToggle();
                    return;
                }
                if (liveTradeOverlayPreset) {
                    liveOverlayTouchedKeysRef.current.add(key);
                }
                setVisibleLevels(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[key] = !prev[key], _a)));
                });
            }} title={setupGated
                ? "Clean view \u2014 tap to show only ".concat(levelStyles[key].label, " in Setup")
                : undefined} className={"rounded-sm px-[5.5px] py-[3.5px] transition md:px-[7px] md:py-[3px] ".concat(setupGated ? 'opacity-70 ring-1 ring-white/[0.06] hover:opacity-95' : '', " ").concat(visibleLevels[key]
                ? "".concat(levelStyles[key].labelClass, " bg-white/[0.08] ring-1 ring-white/15")
                : 'bg-white/[0.03] text-sigflo-muted')} aria-pressed={visibleLevels[key]} aria-label={setupGated ? "Enable setup overlays (".concat(levelStyles[key].label, ")") : "Toggle ".concat(levelStyles[key].label, " level")}>
                  {levelStyles[key].label}
                </button>); })}
            {exchangeStyleHero && metaCaption ? (<>
                <span className="h-3 w-px shrink-0 self-center bg-white/[0.12]" aria-hidden/>
                <span className="shrink-0 whitespace-nowrap text-[7px] font-medium leading-tight text-sigflo-muted md:text-[8px]">
                  {metaCaption}
                </span>
              </>) : null}
          </div>
          <MarketStatsRow_1.MarketStatsRow model={model} variant="compact"/>
        </div>
      </div>
    </Card_1.Card>);
}
