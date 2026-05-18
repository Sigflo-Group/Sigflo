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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuidedExecutionPanel = GuidedExecutionPanel;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var OPEN_CLOSE_EASE = [0.22, 1, 0.36, 1];
function fmtUsd(n) {
    if (!Number.isFinite(n))
        return '—';
    return "$".concat(n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function fmtPx(n) {
    if (!Number.isFinite(n))
        return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n) {
    if (!Number.isFinite(n))
        return '—';
    return "".concat(n.toFixed(2), "%");
}
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function mapExecutionError(msg) {
    var raw = msg.trim();
    if (!raw)
        return 'Order rejected';
    var m = raw.toLowerCase();
    if (m.includes('margin') || m.includes('insufficient'))
        return 'Insufficient margin';
    if (m.includes('price') || m.includes('slippage'))
        return 'Price moved outside accepted range';
    return 'Order rejected';
}
function ExecutionRiskRow(_a) {
    var label = _a.label, value = _a.value;
    return (<div className="rounded-xl border border-white/[0.08] bg-black/25 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>);
}
function ExecutionAdjustDrawer(_a) {
    var open = _a.open, disabled = _a.disabled, direction = _a.direction, entry = _a.entry, positionSizeUsd = _a.positionSizeUsd, leverage = _a.leverage, stop = _a.stop, target = _a.target, onPositionSizeUsd = _a.onPositionSizeUsd, onLeverage = _a.onLeverage, onStop = _a.onStop, onTarget = _a.onTarget;
    return (<framer_motion_1.AnimatePresence initial={false}>
      {open ? (<framer_motion_1.motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: OPEN_CLOSE_EASE }} className="overflow-hidden">
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
            <label className="text-sm text-zinc-300">
              Position Size
              <input disabled={disabled} type="number" value={positionSizeUsd} min={0} step={10} onChange={function (e) { return onPositionSizeUsd(Number(e.target.value)); }} className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"/>
            </label>
            <label className="text-sm text-zinc-300">
              Leverage
              <input disabled={disabled} type="number" value={leverage} min={1} step={0.5} onChange={function (e) { return onLeverage(Number(e.target.value)); }} className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"/>
            </label>
            <label className="text-sm text-zinc-300">
              Stop
              <input disabled={disabled} type="number" value={stop} step={0.01} onChange={function (e) { return onStop(Number(e.target.value)); }} className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"/>
              <span className="mt-1.5 block text-xs leading-snug text-zinc-300/90">
                Tip: use absolute price, or {direction === 'long' ? 'negative' : 'positive'} % like{' '}
                {direction === 'long' ? '-0.2' : '+0.2'} from entry {fmtPx(entry)}.
              </span>
            </label>
            <label className="text-sm text-zinc-300">
              Target
              <input disabled={disabled} type="number" value={target} step={0.01} onChange={function (e) { return onTarget(Number(e.target.value)); }} className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"/>
              <span className="mt-1.5 block text-xs leading-snug text-zinc-300/90">
                Tip: use absolute price, or {direction === 'long' ? 'positive' : 'negative'} % from entry.
              </span>
            </label>
          </div>
        </framer_motion_1.motion.div>) : null}
    </framer_motion_1.AnimatePresence>);
}
function SlideToConfirm(_a) {
    var disabled = _a.disabled, loading = _a.loading, success = _a.success, onConfirm = _a.onConfirm;
    var trackRef = (0, react_1.useRef)(null);
    var progressRef = (0, react_1.useRef)(0);
    var _b = (0, react_1.useState)(0), progress = _b[0], setProgress = _b[1];
    var _c = (0, react_1.useState)(false), dragging = _c[0], setDragging = _c[1];
    /** Matches Tailwind `w-12` (3rem) for hit geometry */
    var knobPx = 48;
    var threshold = 0.86;
    (0, react_1.useEffect)(function () {
        progressRef.current = progress;
    }, [progress]);
    (0, react_1.useEffect)(function () {
        if (loading || success)
            setProgress(1);
    }, [loading, success]);
    var handlePointerDown = function (e) {
        if (disabled || loading || success)
            return;
        var track = trackRef.current;
        if (!track)
            return;
        var pid = e.pointerId;
        var knob = e.currentTarget;
        // Mobile: stop the sheet / page from scrolling during horizontal drag
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
            e.preventDefault();
        }
        try {
            knob.setPointerCapture(pid);
        }
        catch (_a) {
            /* Some WebKit builds: rely on window listeners */
        }
        setDragging(true);
        var syncFromClientX = function (clientX) {
            var r = track.getBoundingClientRect();
            var maxX = Math.max(1, r.width - knobPx - 8);
            var x = clamp(clientX - r.left - knobPx / 2 - 4, 0, maxX);
            var next = x / maxX;
            progressRef.current = next;
            setProgress(next);
        };
        syncFromClientX(e.clientX);
        var onMove = function (ev) {
            if (ev.pointerId !== pid)
                return;
            syncFromClientX(ev.clientX);
        };
        var onEnd = function (ev) {
            if (ev.pointerId !== pid)
                return;
            setDragging(false);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onEnd);
            window.removeEventListener('pointercancel', onEnd);
            try {
                knob.releasePointerCapture(pid);
            }
            catch (_a) {
                /* ignore */
            }
            if (progressRef.current >= threshold) {
                setProgress(1);
                onConfirm();
            }
            else {
                setProgress(0);
            }
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerup', onEnd);
        window.addEventListener('pointercancel', onEnd);
    };
    var fillPct = "".concat(Math.round(progress * 100), "%");
    var label = loading ? 'Sending order...' : success ? 'Confirmed' : 'Slide to execute';
    return (<div className="space-y-2">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Slide to execute</p>
      <div ref={trackRef} className={"relative h-14 w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ".concat(disabled ? 'opacity-60' : '')}>
        <framer_motion_1.motion.div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,rgba(0,255,200,0.22),rgba(0,255,200,0.05))]" animate={{ width: fillPct }} transition={{ duration: 0.15, ease: 'linear' }}/>
        {loading ? (<framer_motion_1.motion.div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]" animate={{ x: ['0%', '220%'] }} transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}/>) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-zinc-100">{label}</span>
        </div>
        <button type="button" onPointerDown={handlePointerDown} aria-label="Slide to execute" disabled={disabled || loading || success} className={"absolute top-1 z-10 h-12 w-12 touch-none select-none rounded-xl border border-white/15 bg-[#0f1216] text-[#00ffc8] shadow-[0_0_20px_-10px_rgba(0,255,200,0.7)] transition-transform duration-100 disabled:cursor-not-allowed ".concat(dragging ? 'scale-[0.97]' : 'scale-100')} style={{ left: "min(calc(100% - 3rem), max(0.25rem, ".concat(fillPct, "))") }}>
          →
        </button>
      </div>
    </div>);
}
function ExecutionSuccessState(_a) {
    var onViewPosition = _a.onViewPosition;
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#00ffc8]/30 bg-[#00ffc8]/8 p-3 text-center">
      <framer_motion_1.motion.div className="mx-auto mb-2 h-10 w-10 rounded-full border border-[#00ffc8]/40 bg-[#00ffc8]/12" animate={{ boxShadow: ['0 0 0 rgba(0,255,200,0)', '0 0 24px rgba(0,255,200,0.58)', '0 0 0 rgba(0,255,200,0)'] }} transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}/>
      <p className="text-sm font-semibold text-[#b8fff2]">Position opened</p>
      <p className="mt-0.5 text-xs text-[#b8fff2]/80">Order sent to broker</p>
      {onViewPosition ? (<button type="button" onClick={onViewPosition} className="mt-2 rounded-lg border border-[#00ffc8]/30 bg-[#00ffc8]/12 px-3 py-1.5 text-xs font-semibold text-[#b8fff2] hover:bg-[#00ffc8]/16">
          View Position
        </button>) : null}
    </framer_motion_1.motion.div>);
}
function GuidedExecutionPanel(_a) {
    var _this = this;
    var _b;
    var open = _a.open, setup = _a.setup, onClose = _a.onClose, onExecute = _a.onExecute, onViewPosition = _a.onViewPosition, _c = _a.previewOnly, previewOnly = _c === void 0 ? false : _c;
    var panelRef = (0, react_1.useRef)(null);
    var _d = (0, react_1.useState)(false), adjustOpen = _d[0], setAdjustOpen = _d[1];
    var _e = (0, react_1.useState)(false), submitting = _e[0], setSubmitting = _e[1];
    var _f = (0, react_1.useState)(false), success = _f[0], setSuccess = _f[1];
    var _g = (0, react_1.useState)(null), error = _g[0], setError = _g[1];
    var _h = (0, react_1.useState)(0), openedAt = _h[0], setOpenedAt = _h[1];
    var _j = (0, react_1.useState)(setup.positionSizeUsd), positionSizeUsd = _j[0], setPositionSizeUsd = _j[1];
    var _k = (0, react_1.useState)(setup.leverage), leverage = _k[0], setLeverage = _k[1];
    var _l = (0, react_1.useState)(setup.stop), stop = _l[0], setStop = _l[1];
    var _m = (0, react_1.useState)(setup.target), target = _m[0], setTarget = _m[1];
    var toRelativeLevelIfPercent = function (raw, type) {
        if (!Number.isFinite(raw))
            return raw;
        // Compact percent input support: -0.2 / +0.2 means +/-0.2% around entry.
        if (Math.abs(raw) > 5 || !(setup.entry > 0))
            return raw;
        if (setup.direction === 'long') {
            if (type === 'stop' && raw < 0)
                return setup.entry * (1 + raw / 100);
            if (type === 'target' && raw > 0)
                return setup.entry * (1 + raw / 100);
            return raw;
        }
        if (type === 'stop' && raw > 0)
            return setup.entry * (1 + raw / 100);
        if (type === 'target' && raw < 0)
            return setup.entry * (1 + raw / 100);
        return raw;
    };
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        setOpenedAt(Date.now());
        setAdjustOpen(false);
        setSubmitting(false);
        setSuccess(false);
        setError(null);
        setPositionSizeUsd(setup.positionSizeUsd);
        setLeverage(setup.leverage);
        setStop(setup.stop);
        setTarget(setup.target);
    }, [open, setup]);
    (0, react_1.useEffect)(function () {
        var _a;
        if (!open)
            return;
        (_a = panelRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, [open]);
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        var onKeyDown = function (e) {
            if (e.key === 'Escape' && !submitting)
                onClose();
            if (e.key !== 'Tab' || !panelRef.current)
                return;
            var focusables = panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusables.length === 0)
                return;
            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return function () { return window.removeEventListener('keydown', onKeyDown); };
    }, [onClose, open, submitting]);
    var uiState = (0, react_1.useMemo)(function () {
        if (!open)
            return 'closed';
        if (submitting)
            return 'submitting';
        if (success)
            return 'success';
        if (error)
            return 'error';
        if (adjustOpen)
            return 'editing';
        if (Date.now() - openedAt < 220)
            return 'opening';
        return 'readyToExecute';
    }, [adjustOpen, error, open, openedAt, submitting, success]);
    var riskReward = (0, react_1.useMemo)(function () {
        if (Number.isFinite(setup.riskRewardRatio))
            return setup.riskRewardRatio;
        var risk = Math.abs(setup.entry - stop);
        var reward = Math.abs(target - setup.entry);
        return risk > 0 ? reward / risk : 0;
    }, [setup.entry, setup.riskRewardRatio, stop, target]);
    var estimatedMargin = (0, react_1.useMemo)(function () {
        if (!(positionSizeUsd > 0) || !(leverage > 0))
            return setup.estimatedMarginUsd;
        return positionSizeUsd / leverage;
    }, [leverage, positionSizeUsd, setup.estimatedMarginUsd]);
    var executeBlockReason = (0, react_1.useMemo)(function () {
        if (submitting)
            return 'Order is submitting…';
        if (success)
            return 'Order already confirmed';
        if (!(positionSizeUsd > 0))
            return 'Position size must be greater than 0';
        if (!(leverage > 0))
            return 'Leverage must be greater than 0';
        if (!(stop > 0) || !(target > 0))
            return 'Stop and target must be valid prices';
        if (!(setup.entry > 0))
            return 'Entry price is not ready yet';
        if (setup.direction === 'long') {
            if (!(stop < setup.entry))
                return 'For longs, stop must be below entry';
            if (!(target > setup.entry))
                return 'For longs, target must be above entry';
            return null;
        }
        if (!(stop > setup.entry))
            return 'For shorts, stop must be above entry';
        if (!(target < setup.entry))
            return 'For shorts, target must be below entry';
        return null;
    }, [leverage, positionSizeUsd, setup.direction, setup.entry, stop, submitting, success, target]);
    var canExecute = executeBlockReason == null;
    var onSubmit = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!canExecute || submitting)
                        return [2 /*return*/];
                    setError(null);
                    setSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, onExecute({
                            symbol: setup.symbol,
                            direction: setup.direction,
                            entry: setup.entry,
                            stop: stop,
                            target: target,
                            positionSizeUsd: positionSizeUsd,
                            leverage: leverage,
                        })];
                case 2:
                    _a.sent();
                    setSuccess(true);
                    setSubmitting(false);
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    msg = e_1 instanceof Error ? e_1.message : '';
                    setError(mapExecutionError(msg));
                    setSubmitting(false);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var directionBadge = setup.direction === 'long'
        ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/25'
        : 'bg-rose-400/15 text-rose-200 ring-rose-400/25';
    var setupScoreText = "".concat(setup.setupScore, " \u2014 ").concat(setup.setupLabel);
    var rationaleText = ((_b = setup.rationale) === null || _b === void 0 ? void 0 : _b.trim()) || 'Conditions aligned across trend, momentum, and structure.';
    return (<framer_motion_1.AnimatePresence>
      {open ? (<framer_motion_1.motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <framer_motion_1.motion.button type="button" aria-label="Close guided execution panel" className="absolute inset-0" onClick={function () {
                if (!submitting)
                    onClose();
            }}/>
          <framer_motion_1.motion.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} className="relative z-10 max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0b]/90 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:max-h-[88vh] md:max-w-md md:rounded-3xl" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.24, ease: OPEN_CLOSE_EASE }}>
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/20 md:hidden"/>
            <div className="max-h-[calc(92dvh-0.5rem)] overflow-y-auto px-5 py-5 md:max-h-[88vh] md:px-6 md:py-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-white">{setup.symbol}</h2>
                    <span className={"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ".concat(directionBadge)}>
                      {setup.direction}
                    </span>
                    <span className="inline-flex rounded-full bg-cyan-500/12 px-2 py-0.5 text-[10px] font-semibold text-cyan-100 ring-1 ring-cyan-400/20">
                      In Play
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-300">{setupScoreText}</p>
                </div>
                <button type="button" disabled={submitting} onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:text-white disabled:opacity-50">
                  Close
                </button>
              </div>

              <p className="mb-4 rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                {rationaleText}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <ExecutionRiskRow label={setup.planEntry != null ? 'Entry (live)' : 'Entry'} value={fmtPx(setup.entry)}/>
                <ExecutionRiskRow label="Stop" value={fmtPx(stop)}/>
                <ExecutionRiskRow label="Target" value={fmtPx(target)}/>
              </div>
              {setup.planEntry != null ? (<p className="mt-1 text-[10px] leading-snug text-zinc-500">
                  Plan entry {fmtPx(setup.planEntry)} · stop and target are the prices sent on the order
                </p>) : null}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <ExecutionRiskRow label="Position Size" value={fmtUsd(positionSizeUsd)}/>
                <ExecutionRiskRow label="Leverage" value={"".concat(leverage.toFixed(1), "x")}/>
                <ExecutionRiskRow label="Estimated Margin" value={fmtUsd(estimatedMargin)}/>
                <ExecutionRiskRow label="Liquidation Buffer" value={fmtPct(setup.liquidationBufferPct)}/>
                <div className="col-span-2">
                  <ExecutionRiskRow label="Risk / Reward" value={"".concat(riskReward.toFixed(2), "R")}/>
                </div>
              </div>

              <div className="mt-3">
                <button type="button" disabled={submitting} onClick={function () { return setAdjustOpen(function (v) { return !v; }); }} className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2 text-left disabled:opacity-60">
                  <span className="text-xs font-semibold text-white">Adjust setup</span>
                  <span className="text-xs text-zinc-400">{adjustOpen ? 'Hide' : 'Optional'}</span>
                </button>
                <ExecutionAdjustDrawer open={adjustOpen} disabled={submitting} direction={setup.direction} entry={setup.entry} positionSizeUsd={positionSizeUsd} leverage={leverage} stop={stop} target={target} onPositionSizeUsd={setPositionSizeUsd} onLeverage={setLeverage} onStop={function (v) { return setStop(toRelativeLevelIfPercent(v, 'stop')); }} onTarget={function (v) { return setTarget(toRelativeLevelIfPercent(v, 'target')); }}/>
              </div>

              <p className="mt-3 text-xs leading-snug text-zinc-400">
                You are responsible for all trades. This setup is generated from market data and may be incorrect.
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {previewOnly
                ? 'Paper preview only. This Bots review path does not submit live orders — even if Risk controls allow live trading elsewhere. Open standard Trade to execute.'
                : 'Execution uses live market fills. Slippage may apply.'}
              </p>

              {previewOnly ? (<div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-sm font-semibold text-white">Paper trade preview</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                    Adjust the draft above to stress-test the plan. Live orders are not available from the Bots review
                    path — use the standard Trade screen without{' '}
                    <span className="font-mono text-[10px] text-zinc-500">source=bots</span> when you are ready to
                    execute with a linked account.
                  </p>
                </div>) : (<div className="mt-3 rounded-2xl border border-white/[0.08] bg-black/35 p-3">
                  <p className="text-sm font-semibold text-white">Execute Setup</p>
                  <div className="mt-2">
                    {uiState === 'success' ? (<ExecutionSuccessState onViewPosition={onViewPosition}/>) : (<div className="space-y-2">
                        <SlideToConfirm disabled={!canExecute} loading={submitting} success={success} onConfirm={function () { return void onSubmit(); }}/>
                        <button type="button" disabled={!canExecute || submitting} onClick={function () { return void onSubmit(); }} className="w-full rounded-xl border border-[#00ffc8]/30 bg-[#00ffc8]/12 px-3 py-2 text-sm font-semibold text-[#bafef1] hover:bg-[#00ffc8]/16 disabled:cursor-not-allowed disabled:opacity-45">
                          Confirm execution (keyboard)
                        </button>
                        {!canExecute ? (<p className="rounded-lg border border-amber-400/20 bg-amber-500/[0.08] p-2 text-xs text-amber-100/90">
                            {executeBlockReason}
                          </p>) : null}
                        {error ? (<div className="rounded-lg border border-rose-400/25 bg-rose-500/[0.08] p-2.5">
                            <p className="text-xs font-medium text-rose-200">{error}</p>
                            <button type="button" onClick={function () { return setError(null); }} className="mt-1 text-xs font-semibold text-rose-100 underline underline-offset-2">
                              Review and try again
                            </button>
                          </div>) : null}
                      </div>)}
                  </div>
                </div>)}
            </div>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>) : null}
    </framer_motion_1.AnimatePresence>);
}
exports.default = GuidedExecutionPanel;
