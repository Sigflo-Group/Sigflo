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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotExecutionSheet = BotExecutionSheet;
var react_1 = require("react");
var tradeRisk_1 = require("@/lib/tradeRisk");
var THUMB_W = 44;
var COMMIT_THRESHOLD = 0.88;
var EXEC_DELAY_MS = 200;
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function roundUsd(n) {
    return Math.round(n * 100) / 100;
}
function TradeSummary(_a) {
    var pairLabel = _a.pairLabel, side = _a.side, entry = _a.entry, stop = _a.stop, target = _a.target;
    var isLong = side === 'long';
    return (<div className="relative isolate overflow-hidden rounded-2xl border border-white/[0.07] bg-black/25 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Pair</p>
          <p className="mt-0.5 text-base font-bold tracking-tight text-landing-text">{pairLabel}</p>
        </div>
        <span className={"shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ".concat(isLong
            ? 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
            : 'border-rose-400/35 bg-rose-500/12 text-rose-100')}>
          {isLong ? 'Long' : 'Short'}
        </span>
      </div>
      <div className="mt-4 flex gap-3">
        <div className="flex w-8 flex-col items-center pt-1">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/90 shadow-[0_0_5px_rgba(52,211,153,0.35)]"/>
          <span className="my-1 w-px flex-1 min-h-[14px] bg-white/10"/>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-landing-accent bg-landing-accent/20 shadow-[0_0_8px_rgba(0,200,120,0.28)]"/>
          <span className="my-1 w-px flex-1 min-h-[14px] bg-white/10"/>
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400/90 shadow-[0_0_5px_rgba(248,113,113,0.28)]"/>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-landing-muted">Target</span>
            <span className="font-mono font-semibold text-emerald-200/95">{target.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-landing-muted">Entry</span>
            <span className="font-mono font-semibold text-landing-text">{entry.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-landing-muted">Stop</span>
            <span className="font-mono font-semibold text-rose-200/90">{stop.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>);
}
function PositionSizeControl(_a) {
    var balanceUsd = _a.balanceUsd, amountUsd = _a.amountUsd, onAmountUsd = _a.onAmountUsd, sizeMode = _a.sizeMode, onSizeMode = _a.onSizeMode, minOrderUsd = _a.minOrderUsd, disabled = _a.disabled;
    var pct = balanceUsd > 0 ? Math.round((amountUsd / balanceUsd) * 1000) / 10 : 0;
    var quick = [10, 25, 50, 100];
    var stepAmount = (0, react_1.useCallback)(function (dir) {
        if (disabled)
            return;
        if (sizeMode === 'usd') {
            var next = roundUsd(amountUsd + dir * 1);
            onAmountUsd(Math.max(0, next));
            return;
        }
        var nextPct = roundUsd(pct + dir * 0.1);
        var c = clamp(nextPct, 0, 100);
        onAmountUsd(roundUsd((c / 100) * balanceUsd));
    }, [amountUsd, balanceUsd, disabled, onAmountUsd, pct, sizeMode]);
    return (<div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Position size</p>
        <div className="flex rounded-lg border border-white/[0.08] bg-black/20 p-0.5">
          <button type="button" disabled={disabled} onClick={function () { return onSizeMode('usd'); }} className={"rounded-md px-2 py-0.5 text-[10px] font-semibold transition ".concat(sizeMode === 'usd' ? 'bg-landing-accent-dim text-landing-accent-hi' : 'text-landing-muted')}>
            USD
          </button>
          <button type="button" disabled={disabled || balanceUsd <= 0} onClick={function () { return onSizeMode('pct'); }} className={"rounded-md px-2 py-0.5 text-[10px] font-semibold transition ".concat(sizeMode === 'pct' ? 'bg-landing-accent-dim text-landing-accent-hi' : 'text-landing-muted')}>
            %
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={"group relative flex min-w-0 flex-1 items-stretch rounded-xl border border-white/[0.1] bg-landing-bg focus-within:ring-2 focus-within:ring-landing-accent/35 ".concat(disabled ? 'opacity-45' : '')}>
          <input type="number" inputMode="decimal" disabled={disabled} min={0} step={sizeMode === 'usd' ? 1 : 0.1} value={sizeMode === 'usd' ? (Number.isFinite(amountUsd) ? amountUsd : '') : pct} onChange={function (e) {
            var v = Number(e.target.value);
            if (!Number.isFinite(v) || v < 0)
                return;
            if (sizeMode === 'usd')
                onAmountUsd(roundUsd(v));
            else
                onAmountUsd(roundUsd((v / 100) * balanceUsd));
        }} className="sigflo-number-input min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-1 font-mono text-sm text-landing-text outline-none disabled:cursor-not-allowed"/>
          <div className="pointer-events-none flex shrink-0 flex-col items-stretch justify-center border-l border-white/[0.08] bg-black/20 py-0.5 pr-0.5 pl-0.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:pointer-events-auto motion-reduce:opacity-100" role="group" aria-label="Step value">
            <button type="button" disabled={disabled || (sizeMode === 'pct' && pct >= 100)} onClick={function (e) {
            e.preventDefault();
            stepAmount(1);
        }} className="flex h-[22px] w-8 items-center justify-center rounded text-landing-muted transition hover:bg-white/[0.08] hover:text-landing-text disabled:pointer-events-none disabled:opacity-30" aria-label={sizeMode === 'usd' ? 'Increase margin' : 'Increase percent'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5l7 7H5l7-7z" fill="currentColor"/>
              </svg>
            </button>
            <button type="button" disabled={disabled || (sizeMode === 'usd' ? amountUsd <= 0 : pct <= 0)} onClick={function (e) {
            e.preventDefault();
            stepAmount(-1);
        }} className="flex h-[22px] w-8 items-center justify-center rounded text-landing-muted transition hover:bg-white/[0.08] hover:text-landing-text disabled:pointer-events-none disabled:opacity-30" aria-label={sizeMode === 'usd' ? 'Decrease margin' : 'Decrease percent'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 19l-7-7h14l-7 7z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-landing-muted">{sizeMode === 'usd' ? 'USDT margin' : '% wallet'}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quick.map(function (p) { return (<button key={p} type="button" disabled={disabled || balanceUsd <= 0} onClick={function () { return onAmountUsd(roundUsd(Math.max(minOrderUsd, (balanceUsd * p) / 100))); }} className="rounded-lg border border-white/[0.08] bg-black/25 px-2.5 py-1.5 text-[10px] font-bold text-landing-text transition hover:border-landing-accent/35 active:scale-[0.97] disabled:opacity-40">
            {p}%
          </button>); })}
      </div>
      <p className="text-[10px] text-landing-muted">
        Available ≈ <span className="font-mono text-landing-text/90">{balanceUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span> USDT
      </p>
    </div>);
}
function RiskSnapshot(_a) {
    var riskUsd = _a.riskUsd, lossPct = _a.lossPct, profitUsd = _a.profitUsd, rr = _a.rr;
    return (<div className="grid grid-cols-2 gap-2 rounded-2xl border border-landing-accent/15 bg-landing-accent-dim/40 px-3 py-2.5">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-landing-muted">Risk</p>
        <p className="mt-0.5 font-mono text-sm font-bold text-rose-200/95">
          {riskUsd >= 0 ? '' : '−'}
          {Math.abs(riskUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })}
        </p>
      </div>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-landing-muted">Max loss %</p>
        <p className="mt-0.5 font-mono text-sm font-bold text-landing-text">{lossPct.toFixed(2)}%</p>
      </div>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-landing-muted">Profit target</p>
        <p className="mt-0.5 font-mono text-sm font-bold text-emerald-200/95">
          +{profitUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })}
        </p>
      </div>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-landing-muted">R:R</p>
        <p className="mt-0.5 font-mono text-sm font-bold text-landing-accent-hi">{Number.isFinite(rr) && rr > 0 ? "".concat(rr.toFixed(2), " : 1") : '—'}</p>
      </div>
    </div>);
}
function ExecutionSlider(_a) {
    var disabled = _a.disabled, busy = _a.busy, onCommit = _a.onCommit;
    var trackRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(0), trackW = _b[0], setTrackW = _b[1];
    var _c = (0, react_1.useState)(0), dragX = _c[0], setDragX = _c[1];
    var _d = (0, react_1.useState)(false), dragging = _d[0], setDragging = _d[1];
    var draggingRef = (0, react_1.useRef)(false);
    var startX = (0, react_1.useRef)(0);
    var startDragX = (0, react_1.useRef)(0);
    var commitScheduledRef = (0, react_1.useRef)(false);
    var maxXRef = (0, react_1.useRef)(0);
    var dragXRef = (0, react_1.useRef)(0);
    var disabledRef = (0, react_1.useRef)(disabled);
    var busyRef = (0, react_1.useRef)(busy);
    var onCommitRef = (0, react_1.useRef)(onCommit);
    var removeWindowListenersRef = (0, react_1.useRef)(null);
    var maxX = Math.max(0, trackW - THUMB_W);
    maxXRef.current = maxX;
    dragXRef.current = dragX;
    disabledRef.current = disabled;
    busyRef.current = busy;
    onCommitRef.current = onCommit;
    var rawProgress = maxX > 0 ? dragX / maxX : 0;
    var fillProgress = maxX > 0 ? Math.pow(rawProgress, 1.12) : 0;
    (0, react_1.useLayoutEffect)(function () {
        var el = trackRef.current;
        if (!el)
            return;
        var measure = function () {
            var w = el.clientWidth;
            setTrackW(w);
            // Sheet layout can report 0px for one frame — without a follow-up measure the thumb thinks maxX is 0.
            if (w === 0) {
                requestAnimationFrame(function () { return setTrackW(el.clientWidth); });
            }
        };
        var ro = new ResizeObserver(measure);
        ro.observe(el);
        measure();
        return function () { return ro.disconnect(); };
    }, []);
    /** Only reset when interaction is blocked — not when `dragging` ends, or the thumb snaps back before commit (felt broken). */
    (0, react_1.useEffect)(function () {
        var _a;
        if (disabled || busy) {
            (_a = removeWindowListenersRef.current) === null || _a === void 0 ? void 0 : _a.call(removeWindowListenersRef);
            removeWindowListenersRef.current = null;
            draggingRef.current = false;
            setDragging(false);
            setDragX(0);
            commitScheduledRef.current = false;
        }
    }, [disabled, busy]);
    (0, react_1.useEffect)(function () { return function () {
        var _a;
        (_a = removeWindowListenersRef.current) === null || _a === void 0 ? void 0 : _a.call(removeWindowListenersRef);
        removeWindowListenersRef.current = null;
    }; }, []);
    var snapBack = (0, react_1.useCallback)(function () {
        setDragX(0);
    }, []);
    var onPointerDown = function (e) {
        var _a;
        if (disabledRef.current || busyRef.current || maxXRef.current <= 0)
            return;
        e.preventDefault();
        e.stopPropagation();
        (_a = removeWindowListenersRef.current) === null || _a === void 0 ? void 0 : _a.call(removeWindowListenersRef);
        removeWindowListenersRef.current = null;
        commitScheduledRef.current = false;
        var pointerId = e.pointerId;
        var target = e.currentTarget;
        try {
            target.setPointerCapture(pointerId);
        }
        catch (_b) {
            /* ignore */
        }
        draggingRef.current = true;
        setDragging(true);
        startX.current = e.clientX;
        startDragX.current = dragXRef.current;
        var removeListeners = function () {
            window.removeEventListener('pointermove', onMove, true);
            window.removeEventListener('pointerup', onUp, true);
            window.removeEventListener('pointercancel', onUp, true);
            removeWindowListenersRef.current = null;
        };
        var onMove = function (ev) {
            if (ev.pointerId !== pointerId)
                return;
            if (!draggingRef.current || disabledRef.current || busyRef.current)
                return;
            ev.preventDefault();
            var dx = ev.clientX - startX.current;
            var mx = maxXRef.current;
            setDragX(clamp(startDragX.current + dx, 0, mx));
        };
        var onUp = function (ev) {
            if (ev.pointerId !== pointerId)
                return;
            removeListeners();
            if (!draggingRef.current)
                return;
            draggingRef.current = false;
            setDragging(false);
            try {
                target.releasePointerCapture(pointerId);
            }
            catch (_a) {
                /* ignore */
            }
            var mx = maxXRef.current;
            var x = clamp(startDragX.current + (ev.clientX - startX.current), 0, mx);
            if (mx > 0 && x >= mx * COMMIT_THRESHOLD && !commitScheduledRef.current) {
                commitScheduledRef.current = true;
                window.setTimeout(function () {
                    onCommitRef.current();
                }, EXEC_DELAY_MS);
            }
            else {
                snapBack();
            }
        };
        removeWindowListenersRef.current = removeListeners;
        window.addEventListener('pointermove', onMove, { capture: true, passive: false });
        window.addEventListener('pointerup', onUp, { capture: true });
        window.addEventListener('pointercancel', onUp, { capture: true });
    };
    return (<div className="select-none">
      <div ref={trackRef} className={"relative h-[52px] touch-none overflow-hidden rounded-2xl border border-landing-accent/25 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_-8px_rgba(0,200,120,0.25)] ".concat(disabled || busy ? 'opacity-45' : '')}>
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-landing-accent/35 to-landing-accent/10 transition-[width] duration-75 ease-out" style={{ width: "".concat(fillProgress * 100, "%") }}/>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-muted">
            {busy ? 'Submitting…' : 'Slide to execute →'}
          </span>
        </div>
        <button type="button" disabled={disabled || busy} onPointerDown={onPointerDown} className="absolute top-1 bottom-1 flex w-11 touch-none items-center justify-center rounded-xl border border-landing-accent/40 bg-landing-surface text-landing-accent-hi shadow-landing-glow-sm transition-[transform] duration-150 ease-out hover:brightness-110 disabled:cursor-not-allowed" style={{
            transform: "translateX(".concat(dragX, "px)"),
            transition: dragging ? 'none' : 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            left: 4,
        }} aria-label="Slide to execute trade">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p className="mt-1.5 text-center text-[9px] text-landing-muted">Full slide required — no tap-to-send</p>
    </div>);
}
function BotExecutionSheet(_a) {
    var _this = this;
    var open = _a.open, onClose = _a.onClose, pairLabel = _a.pairLabel, chartModel = _a.chartModel, side = _a.side, setupScore = _a.setupScore, balanceUsd = _a.balanceUsd, minOrderUsd = _a.minOrderUsd, maxLeverage = _a.maxLeverage, onExecute = _a.onExecute, onViewPosition = _a.onViewPosition, _b = _a.tabBarInsetPx, tabBarInsetPx = _b === void 0 ? 74 : _b;
    var _c = (0, react_1.useState)('usd'), sizeMode = _c[0], setSizeMode = _c[1];
    var _d = (0, react_1.useState)(0), amountUsd = _d[0], setAmountUsd = _d[1];
    var _e = (0, react_1.useState)(10), leverage = _e[0], setLeverage = _e[1];
    var _f = (0, react_1.useState)(false), busy = _f[0], setBusy = _f[1];
    var _g = (0, react_1.useState)('form'), phase = _g[0], setPhase = _g[1];
    var _h = (0, react_1.useState)(null), errorMessage = _h[0], setErrorMessage = _h[1];
    var _j = (0, react_1.useState)(null), errorCta = _j[0], setErrorCta = _j[1];
    var riskModel = (0, react_1.useMemo)(function () { return (__assign(__assign({}, chartModel), { balanceUsd: Math.max(0, balanceUsd) })); }, [chartModel, balanceUsd]);
    var cappedLev = clamp(leverage, 1, maxLeverage);
    var cappedAmount = clamp(amountUsd, 0, Math.max(0, balanceUsd));
    var metrics = (0, react_1.useMemo)(function () {
        return (0, tradeRisk_1.deriveTradeMetrics)(riskModel, {
            amountUsd: cappedAmount,
            leverage: cappedLev,
            side: side,
            market: 'futures',
            setupScore: setupScore,
        });
    }, [riskModel, cappedAmount, cappedLev, side, setupScore]);
    var lossPct = cappedAmount > 0 ? (Math.abs(metrics.stopLossUsd) / cappedAmount) * 100 : 0;
    var rr = metrics.stopLossUsd !== 0 ? Math.abs(metrics.targetProfitUsd / metrics.stopLossUsd) : chartModel.riskReward;
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        setPhase('form');
        setErrorMessage(null);
        setErrorCta(null);
        setBusy(false);
        var seed = roundUsd(Math.max(minOrderUsd, balanceUsd > 0 ? (balanceUsd * 10) / 100 : minOrderUsd));
        setAmountUsd(clamp(seed, minOrderUsd, Math.max(minOrderUsd, balanceUsd)));
        setLeverage(clamp(10, 1, maxLeverage));
    }, [open, balanceUsd, minOrderUsd, maxLeverage]);
    var canSlide = balanceUsd >= minOrderUsd &&
        cappedAmount >= minOrderUsd &&
        Number.isFinite(chartModel.entry) &&
        chartModel.entry > 0 &&
        !busy &&
        phase === 'form';
    var runExecute = function () { return __awaiter(_this, void 0, void 0, function () {
        var canSubmitNow, res, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    canSubmitNow = balanceUsd >= minOrderUsd &&
                        cappedAmount >= minOrderUsd &&
                        Number.isFinite(chartModel.entry) &&
                        chartModel.entry > 0 &&
                        !busy;
                    if (!canSubmitNow)
                        return [2 /*return*/];
                    setBusy(true);
                    setErrorMessage(null);
                    setErrorCta(null);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onExecute({ amountUsd: cappedAmount, leverage: cappedLev })];
                case 2:
                    res = _d.sent();
                    if (res.ok) {
                        try {
                            (_b = navigator.vibrate) === null || _b === void 0 ? void 0 : _b.call(navigator, 12);
                        }
                        catch (_e) {
                            /* ignore */
                        }
                        setPhase('success');
                    }
                    else {
                        setPhase('error');
                        setErrorMessage(res.message);
                        setErrorCta((_c = res.cta) !== null && _c !== void 0 ? _c : null);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    _a = _d.sent();
                    setPhase('error');
                    setErrorMessage('Something went wrong — try again.');
                    setErrorCta(null);
                    return [3 /*break*/, 5];
                case 4:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (!open)
        return null;
    var bottomOffset = "calc(".concat(tabBarInsetPx, "px + env(safe-area-inset-bottom, 0px))");
    return (<>
      <button type="button" aria-label="Close execution panel" className="fixed inset-0 z-[43] bg-black/55 backdrop-blur-[2px] transition-opacity" onClick={onClose}/>
      <div className="fixed left-0 right-0 z-[44] flex max-h-[min(58vh,520px)] flex-col rounded-t-3xl border border-white/[0.09] bg-landing-surface landing-panel-texture" style={{
            bottom: bottomOffset,
            /** Downward-only shadow — avoid negative Y / spread halos that paint over the chart above the sheet. */
            boxShadow: '0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
        }} role="dialog" aria-modal="true" aria-labelledby="bot-exec-title">
        <div className="flex justify-center pt-2 pb-1">
          <span className="h-1 w-10 rounded-full bg-white/15"/>
        </div>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 pb-2">
          <h2 id="bot-exec-title" className="text-sm font-bold text-landing-text">
            Execute trade
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-semibold text-landing-muted transition hover:text-landing-text">
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
          {phase === 'success' ? (<div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-landing-accent/40 bg-landing-accent-dim shadow-landing-glow animate-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-landing-accent-hi" aria-hidden>
                  <path d="M6 12.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="mt-4 text-lg font-bold text-landing-text">Trade executed</p>
              <p className="mt-1 text-xs text-landing-muted">Position is live — chart overlays updated.</p>
              <button type="button" onClick={function () {
                onViewPosition();
                onClose();
            }} className="mt-6 w-full rounded-xl bg-landing-accent py-3 text-sm font-bold text-landing-bg shadow-landing-glow-sm transition active:scale-[0.98]">
                View position
              </button>
              <button type="button" onClick={onClose} className="mt-2 text-xs font-semibold text-landing-muted hover:text-landing-text">
                Stay on focus
              </button>
            </div>) : (<>
              <TradeSummary pairLabel={pairLabel} side={side} entry={chartModel.entry} stop={chartModel.stop} target={chartModel.target}/>
              <div className="mt-4">
                <PositionSizeControl balanceUsd={balanceUsd} amountUsd={cappedAmount} onAmountUsd={function (n) { return setAmountUsd(clamp(roundUsd(n), 0, Math.max(0, balanceUsd))); }} sizeMode={sizeMode} onSizeMode={setSizeMode} minOrderUsd={minOrderUsd} disabled={busy}/>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Leverage</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <input type="range" min={1} max={maxLeverage} step={1} value={cappedLev} disabled={busy} onChange={function (e) { return setLeverage(Number(e.target.value)); }} className="h-1.5 flex-1 accent-landing-accent"/>
                  <span className="w-10 text-right font-mono text-xs font-bold text-landing-accent-hi">{cappedLev}×</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Risk snapshot</p>
                <RiskSnapshot riskUsd={metrics.stopLossUsd} lossPct={lossPct} profitUsd={metrics.targetProfitUsd} rr={rr}/>
              </div>
              {phase === 'error' && errorMessage ? (<div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-100">
                  {errorMessage}
                  {errorCta ? (<button type="button" className="mt-2 block w-full rounded-lg border border-rose-300/45 bg-rose-500/12 py-2 text-[11px] font-bold uppercase tracking-wide text-rose-100 transition hover:bg-rose-500/18" onClick={function () {
                        window.open(errorCta.href, '_blank', 'noopener,noreferrer');
                    }}>
                      {errorCta.label}
                    </button>) : null}
                  {errorCta ? (<button type="button" className="mt-2 block w-full rounded-lg border border-cyan-300/40 bg-cyan-500/10 py-2 text-[11px] font-bold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/18" onClick={function () {
                        void runExecute();
                    }}>
                      I accepted terms, retry now
                    </button>) : null}
                  <button type="button" className="mt-2 block w-full rounded-lg border border-rose-400/35 py-2 text-[11px] font-bold uppercase tracking-wide text-rose-100 transition hover:bg-rose-500/15" onClick={function () {
                    setPhase('form');
                    setErrorMessage(null);
                    setErrorCta(null);
                }}>
                    Retry
                  </button>
                </div>) : null}
              <div className="mt-5">
                <ExecutionSlider key={phase} disabled={!canSlide} busy={busy} onCommit={runExecute}/>
              </div>
            </>)}
        </div>
      </div>
    </>);
}
