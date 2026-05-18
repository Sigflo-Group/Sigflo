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
exports.AdjustRiskSheet = AdjustRiskSheet;
var react_1 = require("react");
var formatQuote_1 = require("@/lib/formatQuote");
var THUMB_W = 44;
var SLIDE_COMMIT_THRESHOLD = 0.88;
var SLIDE_COMMIT_DELAY_MS = 200;
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
var FOCUS_STEPS = [25, 50, 75, 100];
var PROFILE_META = {
    let_run: {
        label: 'Let it run',
        blurb: 'Wider loss room, later trims, trend-following exits.',
        strategy: 'trend_follow',
        safeguards: {
            maxLossPct: 8,
            minProfitBeforeTrimPct: 1.4,
            allowPartialExits: true,
            allowFullAutoClose: true,
        },
    },
    balanced: {
        label: 'Balanced',
        blurb: 'Default safeguards — protect profit without over-tightening.',
        strategy: 'protect_profit',
        safeguards: {
            maxLossPct: 5,
            minProfitBeforeTrimPct: 0.35,
            allowPartialExits: true,
            allowFullAutoClose: true,
        },
    },
    protect: {
        label: 'Protect capital',
        blurb: 'Tighter max loss, earlier trims, defensive exits.',
        strategy: 'tight_risk',
        safeguards: {
            maxLossPct: 2.5,
            minProfitBeforeTrimPct: 0.12,
            allowPartialExits: true,
            allowFullAutoClose: true,
        },
    },
};
function profileFromStrategy(s) {
    if (s === 'trend_follow')
        return 'let_run';
    if (s === 'tight_risk')
        return 'protect';
    return 'balanced';
}
function fmtSignedUsd(n) {
    var sign = n >= 0 ? '+' : '−';
    return "".concat(sign, "$").concat(Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function computePreview(snap, draftStop, focusPct) {
    var scale = focusPct / 100;
    var notional = Math.max(0, snap.positionNotionalUsd) * scale;
    var entry = Math.max(1e-12, snap.entryPrice);
    var target = snap.targetPrice;
    var side = snap.side;
    var riskDist = 0;
    if (side === 'long') {
        riskDist = entry - draftStop;
    }
    else {
        riskDist = draftStop - entry;
    }
    if (!Number.isFinite(riskDist) || riskDist <= 0) {
        return {
            maxLossUsd: 0,
            lockedProfitUsd: 0,
            rr: null,
            riskUsd: 0,
            exposureUsd: notional,
        };
    }
    var maxLossUsd = notional * (riskDist / entry);
    var locked = 0;
    if (side === 'long' && draftStop > entry) {
        locked = notional * ((draftStop - entry) / entry);
    }
    else if (side === 'short' && draftStop < entry) {
        locked = notional * ((entry - draftStop) / entry);
    }
    var rewardDist = 0;
    if (side === 'long') {
        rewardDist = target - entry;
    }
    else {
        rewardDist = entry - target;
    }
    var rr = Number.isFinite(rewardDist) && rewardDist > 0 && riskDist > 0 ? rewardDist / riskDist : null;
    return {
        maxLossUsd: maxLossUsd,
        lockedProfitUsd: Math.max(0, locked),
        rr: rr,
        riskUsd: maxLossUsd,
        exposureUsd: notional,
    };
}
function SlideToApply(_a) {
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
            if (w === 0) {
                requestAnimationFrame(function () { return setTrackW(el.clientWidth); });
            }
        };
        var ro = new ResizeObserver(measure);
        ro.observe(el);
        measure();
        return function () { return ro.disconnect(); };
    }, []);
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
    var snapBack = (0, react_1.useCallback)(function () { return setDragX(0); }, []);
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
            if (mx > 0 && x >= mx * SLIDE_COMMIT_THRESHOLD && !commitScheduledRef.current) {
                commitScheduledRef.current = true;
                window.setTimeout(function () { return onCommitRef.current(); }, SLIDE_COMMIT_DELAY_MS);
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
      <div ref={trackRef} className={"relative h-[48px] touch-none overflow-hidden rounded-2xl border border-landing-accent/25 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ".concat(disabled || busy ? 'opacity-45' : '')}>
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-landing-accent/30 to-landing-accent/10 transition-[width] duration-75 ease-out" style={{ width: "".concat(fillProgress * 100, "%") }}/>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            {busy ? 'Applying…' : 'Slide to apply →'}
          </span>
        </div>
        <button type="button" disabled={disabled || busy} onPointerDown={onPointerDown} className="absolute top-1 bottom-1 flex w-11 touch-none items-center justify-center rounded-xl border border-landing-accent/40 bg-landing-surface text-landing-accent-hi shadow-landing-glow-sm transition-[transform] duration-150 ease-out hover:brightness-110 disabled:cursor-not-allowed" style={{
            transform: "translateX(".concat(dragX, "px)"),
            transition: dragging ? 'none' : 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            left: 4,
        }} aria-label="Slide to apply risk changes">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p className="mt-1.5 text-center text-[9px] text-landing-muted">Full slide required — confirms your risk plan</p>
    </div>);
}
function AdjustRiskSheet(_a) {
    var _this = this;
    var open = _a.open, onClose = _a.onClose, tabBarInsetPx = _a.tabBarInsetPx, snapshot = _a.snapshot, exitAuto = _a.exitAuto, onApplyExchangeStop = _a.onApplyExchangeStop, exchangeStopApplyDisabled = _a.exchangeStopApplyDisabled;
    var _b = (0, react_1.useState)('balanced'), profileId = _b[0], setProfileId = _b[1];
    var _c = (0, react_1.useState)(100), focusPct = _c[0], setFocusPct = _c[1];
    var _d = (0, react_1.useState)(0), draftStop = _d[0], setDraftStop = _d[1];
    var _e = (0, react_1.useState)(0), baselineStop = _e[0], setBaselineStop = _e[1];
    var _f = (0, react_1.useState)(false), applyBusy = _f[0], setApplyBusy = _f[1];
    var seededForOpenRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        if (!open) {
            seededForOpenRef.current = false;
            return;
        }
        if (!snapshot || seededForOpenRef.current)
            return;
        seededForOpenRef.current = true;
        setProfileId(profileFromStrategy(exitAuto.strategy));
        setFocusPct(100);
        var s = Number.isFinite(snapshot.stopPrice) && snapshot.stopPrice > 0 ? snapshot.stopPrice : snapshot.entryPrice;
        setDraftStop(s);
        setBaselineStop(s);
    }, [open, snapshot, exitAuto.strategy]);
    var preview = (0, react_1.useMemo)(function () {
        if (!snapshot) {
            return {
                maxLossUsd: 0,
                lockedProfitUsd: 0,
                rr: null,
                riskUsd: 0,
                exposureUsd: 0,
            };
        }
        return computePreview(snapshot, draftStop, focusPct);
    }, [snapshot, draftStop, focusPct]);
    var applyProfile = (0, react_1.useCallback)(function (id) {
        setProfileId(id);
    }, []);
    var nudgeStopCustom = (0, react_1.useCallback)(function (dir) {
        if (!snapshot)
            return;
        var entry = snapshot.entryPrice;
        if (!(entry > 0))
            return;
        var step = entry * 0.0025 * dir;
        setDraftStop(function (prev) {
            var next = snapshot.side === 'long' ? prev + step : prev - step;
            if (!Number.isFinite(next) || next <= 0)
                return prev;
            return next;
        });
    }, [snapshot]);
    var onBreakeven = (0, react_1.useCallback)(function () {
        if (!snapshot)
            return;
        var entry = snapshot.entryPrice;
        if (!(entry > 0))
            return;
        var buf = 0.00012;
        var be = snapshot.side === 'long' ? entry * (1 - buf) : entry * (1 + buf);
        setDraftStop(be);
    }, [snapshot]);
    var onTighten = (0, react_1.useCallback)(function () {
        if (!snapshot)
            return;
        var entry = snapshot.entryPrice;
        var cur = draftStop;
        if (!(entry > 0) || !(cur > 0))
            return;
        var tightened = snapshot.side === 'long' ? cur + (entry - cur) * 0.38 : cur - (cur - entry) * 0.38;
        if (Number.isFinite(tightened) && tightened > 0)
            setDraftStop(tightened);
    }, [draftStop, snapshot]);
    var handleApply = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var meta, stopChanged, pctLine, stopLine;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!snapshot)
                        return [2 /*return*/];
                    meta = PROFILE_META[profileId];
                    exitAuto.setStrategy(meta.strategy);
                    exitAuto.setSafeguards(__assign({}, meta.safeguards));
                    stopChanged = Math.abs(draftStop - baselineStop) > baselineStop * 1e-8;
                    if (!(onApplyExchangeStop && stopChanged && !exchangeStopApplyDisabled)) return [3 /*break*/, 4];
                    setApplyBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, onApplyExchangeStop(draftStop)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    setApplyBusy(false);
                    return [7 /*endfinally*/];
                case 4:
                    pctLine = "Exposure view ".concat(focusPct, "%");
                    stopLine = stopChanged
                        ? onApplyExchangeStop && !exchangeStopApplyDisabled
                            ? "Stop synced ~$".concat((0, formatQuote_1.formatQuoteNumber)(draftStop))
                            : "Stop plan ~$".concat((0, formatQuote_1.formatQuoteNumber)(draftStop), " (sync in Manage if needed)")
                        : 'Stop unchanged';
                    exitAuto.pushActivity({
                        kind: 'strategy_change',
                        message: "Risk profile: ".concat(meta.label, " \u00B7 ").concat(pctLine, " \u00B7 ").concat(stopLine),
                    });
                    onClose();
                    return [2 /*return*/];
            }
        });
    }); }, [
        baselineStop,
        draftStop,
        exchangeStopApplyDisabled,
        exitAuto,
        focusPct,
        onApplyExchangeStop,
        onClose,
        profileId,
        snapshot,
    ]);
    if (!open)
        return null;
    var bottomPad = "calc(".concat(tabBarInsetPx, "px + env(safe-area-inset-bottom, 0px) + 12px)");
    return (<>
      <button type="button" aria-label="Dismiss adjust risk" className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[2px]" onClick={onClose}/>
      <div className="fixed left-0 right-0 z-[121] mx-auto max-h-[min(88vh,640px)] w-full max-w-lg overflow-hidden rounded-t-3xl border border-white/[0.08] bg-landing-surface landing-panel-texture shadow-landing-card" style={{ bottom: 0, paddingBottom: bottomPad }}>
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/15"/>
        </div>
        <div className="border-b border-white/[0.06] px-4 pb-3 pt-1">
          <h2 className="text-base font-bold text-landing-text">Adjust risk</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-landing-muted">
            Tune automation and your stop plan before you commit — one slide to apply.
          </p>
        </div>

        <div className="max-h-[min(62vh,520px)] overflow-y-auto overscroll-y-contain px-4 py-3">
          {!snapshot ? (<p className="text-sm text-landing-muted">No active position context.</p>) : (<div className="space-y-4">
              <section className="rounded-2xl border border-white/[0.07] bg-black/25 px-3 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Position</p>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-landing-text">{snapshot.pairLabel}</p>
                    <p className="mt-0.5 text-[11px] text-landing-muted">
                      Size ≈{' '}
                      <span className="font-mono font-semibold text-landing-text">
                        ${Math.round(snapshot.positionNotionalUsd).toLocaleString('en-US')}
                      </span>{' '}
                      notional
                    </p>
                  </div>
                  <span className={"shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ".concat(snapshot.side === 'long'
                ? 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
                : 'border-rose-400/35 bg-rose-500/12 text-rose-100')}>
                    {snapshot.side === 'long' ? 'Long' : 'Short'}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <dt className="text-landing-muted">Entry</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                      ${(0, formatQuote_1.formatQuoteNumber)(snapshot.entryPrice)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-landing-muted">Mark</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                      ${(0, formatQuote_1.formatQuoteNumber)(snapshot.markPrice)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-landing-muted">Unrealized PnL</dt>
                    <dd className={"mt-0.5 font-mono text-sm font-bold ".concat(snapshot.pnlUsd >= 0 ? 'text-emerald-200/95' : 'text-rose-200/90')}>
                      {fmtSignedUsd(snapshot.pnlUsd)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">
                  Risk profile
                </p>
                <div className="grid gap-2">
                  {Object.keys(PROFILE_META).map(function (id) {
                var m = PROFILE_META[id];
                var active = profileId === id;
                return (<button key={id} type="button" onClick={function () { return applyProfile(id); }} className={"rounded-2xl border px-3 py-2.5 text-left transition active:scale-[0.99] ".concat(active
                        ? 'border-landing-accent/45 bg-landing-accent-dim/80 ring-1 ring-landing-accent/25'
                        : 'border-white/[0.08] bg-black/20 hover:border-white/[0.12]')}>
                        <p className="text-[13px] font-bold text-landing-text">{m.label}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-landing-muted">{m.blurb}</p>
                      </button>);
            })}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">
                  Position size focus
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-landing-muted">
                  Preview risk and exposure as a fraction of the open leg (does not scale the live order until you
                  partially close).
                </p>
                <div className="mt-3 flex gap-1.5">
                  {FOCUS_STEPS.map(function (p) { return (<button key={p} type="button" onClick={function () { return setFocusPct(p); }} className={"flex-1 rounded-xl py-2 text-[11px] font-bold transition active:scale-[0.98] ".concat(focusPct === p
                    ? 'bg-landing-accent-dim text-landing-accent-hi ring-1 ring-landing-accent/30'
                    : 'border border-white/[0.08] bg-landing-bg/80 text-landing-muted')}>
                      {p}%
                    </button>); })}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-landing-muted">Risk at stop (preview)</span>
                    <p className="mt-0.5 font-mono font-semibold text-rose-200/90">
                      ≈ ${preview.maxLossUsd.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-landing-muted">Exposure (preview)</span>
                    <p className="mt-0.5 font-mono font-semibold text-landing-text">
                      ≈ ${preview.exposureUsd.toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">
                  Stop loss
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={onBreakeven} className="rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture py-2.5 text-[11px] font-bold text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99]">
                    Move to breakeven
                  </button>
                  <button type="button" onClick={onTighten} className="rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture py-2.5 text-[11px] font-bold text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99]">
                    Tighten stop
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={function () { return nudgeStopCustom(-1); }} className="flex-1 rounded-xl border border-white/[0.08] bg-black/25 py-2 text-[10px] font-bold text-landing-muted transition hover:border-white/[0.14] active:scale-[0.99]">
                    Custom −0.25%
                  </button>
                  <button type="button" onClick={function () { return nudgeStopCustom(1); }} className="flex-1 rounded-xl border border-white/[0.08] bg-black/25 py-2 text-[10px] font-bold text-landing-muted transition hover:border-white/[0.14] active:scale-[0.99]">
                    Custom +0.25%
                  </button>
                </div>
                <p className="mt-2 text-center font-mono text-[11px] text-landing-text">
                  Draft stop ~${(0, formatQuote_1.formatQuoteNumber)(draftStop)}
                </p>
              </section>

              <section className="rounded-2xl border border-landing-accent/20 bg-landing-accent-dim/25 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Live preview</p>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <dt className="text-landing-muted">Max loss</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-rose-200/90">
                      ${preview.maxLossUsd.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-landing-muted">Locked profit</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-emerald-200/90">
                      ${preview.lockedProfitUsd.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-landing-muted">R:R</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                      {preview.rr != null && Number.isFinite(preview.rr) ? "".concat(preview.rr.toFixed(2), " : 1") : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              {exitAuto.mode !== 'manual' ? (<p className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.08] px-3 py-2 text-[11px] leading-relaxed text-cyan-100/90">
                  AI will adjust exit strategy accordingly ({PROFILE_META[profileId].label} preset).
                </p>) : null}

              <SlideToApply disabled={!snapshot || applyBusy} busy={applyBusy} onCommit={function () { return void handleApply(); }}/>
            </div>)}
        </div>
      </div>
    </>);
}
