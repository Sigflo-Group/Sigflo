"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagePartialCloseSheet = ManagePartialCloseSheet;
var react_1 = require("react");
var THUMB_W = 44;
var COMMIT_THRESHOLD = 0.88;
var EXEC_DELAY_MS = 200;
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function SlideToExecute(_a) {
    var disabled = _a.disabled, busy = _a.busy, label = _a.label, onCommit = _a.onCommit;
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
        var onWindowResize = function () { return measure(); };
        window.addEventListener('resize', onWindowResize, { passive: true });
        var ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(measure);
            ro.observe(el);
        }
        measure();
        var t = window.setTimeout(measure, 80);
        return function () {
            window.clearTimeout(t);
            window.removeEventListener('resize', onWindowResize);
            ro === null || ro === void 0 ? void 0 : ro.disconnect();
        };
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
            if (mx > 0 && x >= mx * COMMIT_THRESHOLD && !commitScheduledRef.current) {
                commitScheduledRef.current = true;
                window.setTimeout(function () { return onCommitRef.current(); }, EXEC_DELAY_MS);
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
    return (<div ref={trackRef} className="relative h-[48px] touch-none overflow-hidden rounded-2xl border border-landing-accent/25 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-landing-accent/30 to-landing-accent/10 transition-[width] duration-75 ease-out" style={{ width: "".concat(fillProgress * 100, "%") }}/>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
          {busy ? 'Submitting…' : label}
        </span>
      </div>
      <button type="button" disabled={disabled || busy} onPointerDown={onPointerDown} className="absolute top-1 bottom-1 flex w-11 touch-none items-center justify-center rounded-xl border border-landing-accent/40 bg-landing-surface text-landing-accent-hi shadow-landing-glow-sm transition-[transform] duration-150 ease-out disabled:cursor-not-allowed" style={{
            transform: "translateX(".concat(dragX, "px)"),
            transition: dragging ? 'none' : 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            left: 4,
        }} aria-label="Slide to confirm partial close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>);
}
function ManagePartialCloseSheet(_a) {
    var open = _a.open, onClose = _a.onClose, fraction = _a.fraction, onFractionChange = _a.onFractionChange, onConfirm = _a.onConfirm, _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.busy, busy = _c === void 0 ? false : _c;
    var _d = (0, react_1.useState)(false), localBusy = _d[0], setLocalBusy = _d[1];
    var presets = [25, 50, 75, 100];
    (0, react_1.useEffect)(function () {
        if (!open)
            setLocalBusy(false);
    }, [open]);
    var run = (0, react_1.useCallback)(function () {
        if (disabled || busy || localBusy)
            return;
        setLocalBusy(true);
        try {
            onConfirm(fraction);
        }
        finally {
            window.setTimeout(function () { return setLocalBusy(false); }, 400);
        }
    }, [disabled, busy, localBusy, onConfirm, fraction]);
    if (!open)
        return null;
    /** Keep the sheet above the persistent bottom trade controls so confirm actions are immediately visible. */
    var bottom = "calc(max(0.75rem, env(safe-area-inset-bottom, 0px)) + 5.5rem)";
    return (<>
      <button type="button" aria-label="Close" className="fixed inset-0 z-[52] bg-black/50 backdrop-blur-[1px]" onClick={onClose}/>
      <div className="fixed left-0 right-0 z-[53] mx-auto max-w-lg rounded-t-3xl border border-landing-border bg-landing-surface landing-panel-texture px-4 pb-4 pt-2 shadow-[0_-16px_48px_rgba(0,0,0,0.55),0_0_40px_-12px_rgba(0,200,120,0.2)]" style={{ bottom: bottom }} role="dialog" aria-modal="true">
        <div className="flex justify-center pb-2">
          <span className="h-1 w-9 rounded-full bg-white/20"/>
        </div>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <h2 className="text-sm font-bold text-landing-text">Partial close</h2>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-landing-muted">
            Cancel
          </button>
        </div>
        <p className="mt-2 text-[11px] text-landing-muted">
          Choose how much of the open leg to scale out. Slide to confirm — same safety as entry execution.
        </p>
        <div className="mt-3 flex gap-2">
          {presets.map(function (p) { return (<button key={p} type="button" disabled={disabled || busy} onClick={function () { return onFractionChange(p / 100); }} className={"flex-1 rounded-xl border py-2 text-[11px] font-bold transition active:scale-[0.98] ".concat(Math.abs(fraction * 100 - p) < 1
                ? 'border-landing-accent/45 bg-landing-accent-dim text-landing-accent-hi'
                : 'border-white/[0.08] bg-black/25 text-landing-text')}>
              {p}%
            </button>); })}
        </div>
        <div className="mt-4">
          <SlideToExecute disabled={disabled || busy} busy={busy || localBusy} label="Slide to close slice →" onCommit={run}/>
          <button type="button" disabled={disabled || busy || localBusy} onClick={run} className="sigflo-pressable mt-2 w-full rounded-xl border border-landing-accent/35 bg-landing-accent-dim/35 py-2 text-[11px] font-bold text-landing-accent-hi shadow-[0_12px_28px_-16px_rgba(0,255,200,0.55)] transition hover:border-landing-accent/50 disabled:cursor-not-allowed disabled:opacity-45">
            {busy || localBusy ? 'Submitting…' : 'Confirm partial close'}
          </button>
        </div>
      </div>
    </>);
}
