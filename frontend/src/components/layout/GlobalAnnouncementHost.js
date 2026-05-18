"use strict";
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
exports.GlobalAnnouncementHost = GlobalAnnouncementHost;
var react_1 = require("react");
var appAnnouncementsPreference_1 = require("@/lib/appAnnouncementsPreference");
var globalAnnouncements_1 = require("@/lib/globalAnnouncements");
var AUTO_DISMISS_MS = 5200;
var MAX_VISIBLE = 4;
function tryOsNotification(a) {
    var _a;
    try {
        if (!(0, appAnnouncementsPreference_1.readAppAnnouncementsEnabled)())
            return;
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted')
            return;
        new Notification(a.title, {
            body: (_a = a.subtitle) !== null && _a !== void 0 ? _a : '',
            tag: a.id,
        });
    }
    catch (_b) {
        /* ignore */
    }
}
function tryHaptic(kind) {
    var _a, _b;
    try {
        if (!(0, appAnnouncementsPreference_1.readAppAnnouncementsEnabled)())
            return;
        if (kind === 'bias_flip')
            (_a = navigator.vibrate) === null || _a === void 0 ? void 0 : _a.call(navigator, [12, 36, 12]);
        else
            (_b = navigator.vibrate) === null || _b === void 0 ? void 0 : _b.call(navigator, [10, 28, 10]);
    }
    catch (_c) {
        /* ignore */
    }
}
function GlobalAnnouncementHost() {
    var _a;
    var _b = (0, react_1.useState)([]), items = _b[0], setItems = _b[1];
    var _c = (0, react_1.useState)([]), aiModalQueue = _c[0], setAiModalQueue = _c[1];
    var timersRef = (0, react_1.useRef)(new Map());
    var dismiss = (0, react_1.useCallback)(function (id) {
        var t = timersRef.current.get(id);
        if (t != null) {
            window.clearTimeout(t);
            timersRef.current.delete(id);
        }
        setItems(function (prev) { return prev.filter(function (x) { return x.id !== id; }); });
    }, []);
    (0, react_1.useEffect)(function () {
        return (0, globalAnnouncements_1.subscribeGlobalAnnouncements)(function (a) {
            if (!(0, appAnnouncementsPreference_1.readAppAnnouncementsEnabled)())
                return;
            tryOsNotification(a);
            tryHaptic(a.kind);
            if (a.kind === 'ai_action' && /exit/i.test(a.title)) {
                // Exit AI actions should be unmissable: use a blocking modal queue.
                setAiModalQueue(function (prev) { return __spreadArray(__spreadArray([], prev, true), [a], false); });
                return;
            }
            setItems(function (prev) { return __spreadArray(__spreadArray([], prev, true), [a], false).slice(-MAX_VISIBLE); });
            var t = window.setTimeout(function () { return dismiss(a.id); }, AUTO_DISMISS_MS);
            timersRef.current.set(a.id, t);
        });
    }, [dismiss]);
    var dismissAiModal = (0, react_1.useCallback)(function () {
        setAiModalQueue(function (prev) { return prev.slice(1); });
    }, []);
    (0, react_1.useEffect)(function () {
        var clearWhenMuted = function () {
            if ((0, appAnnouncementsPreference_1.readAppAnnouncementsEnabled)())
                return;
            for (var _i = 0, _a = timersRef.current.values(); _i < _a.length; _i++) {
                var t = _a[_i];
                window.clearTimeout(t);
            }
            timersRef.current.clear();
            setItems([]);
            setAiModalQueue([]);
        };
        window.addEventListener(appAnnouncementsPreference_1.APP_ANNOUNCEMENTS_PREF_EVENT, clearWhenMuted);
        window.addEventListener('storage', clearWhenMuted);
        return function () {
            window.removeEventListener(appAnnouncementsPreference_1.APP_ANNOUNCEMENTS_PREF_EVENT, clearWhenMuted);
            window.removeEventListener('storage', clearWhenMuted);
        };
    }, []);
    (0, react_1.useEffect)(function () {
        return function () {
            for (var _i = 0, _a = timersRef.current.values(); _i < _a.length; _i++) {
                var t = _a[_i];
                window.clearTimeout(t);
            }
            timersRef.current.clear();
        };
    }, []);
    var activeAiModal = (_a = aiModalQueue[0]) !== null && _a !== void 0 ? _a : null;
    if (items.length === 0 && !activeAiModal)
        return null;
    return (<>
      {items.length > 0 ? (<div className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]" aria-live="polite">
          {items.map(function (a) { return (<button key={a.id} type="button" onClick={function () { return dismiss(a.id); }} className={"pointer-events-auto w-full max-w-md rounded-xl border px-3.5 py-2.5 text-left shadow-[0_16px_48px_-12px_rgba(0,0,0,0.75)] backdrop-blur-md transition duration-200 ".concat(a.kind === 'bias_flip'
                    ? 'border-cyan-400/40 bg-black/88 ring-1 ring-cyan-400/15'
                    : 'border-violet-400/35 bg-black/88 ring-1 ring-violet-400/12')}>
              <p className={"text-[11px] font-bold uppercase tracking-[0.12em] ".concat(a.kind === 'bias_flip' ? 'text-cyan-200/95' : 'text-violet-200/95')}>
                {a.title}
              </p>
              {a.subtitle ? (<p className="mt-0.5 text-sm font-semibold leading-snug text-white/95">{a.subtitle}</p>) : null}
              <p className="mt-1 text-[9px] font-medium text-white/40">Tap to dismiss</p>
            </button>); })}
        </div>) : null}

      {activeAiModal ? (<div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-live="assertive" className="w-full max-w-md rounded-2xl border border-violet-300/35 bg-[#08080c] p-4 shadow-[0_20px_70px_-18px_rgba(0,0,0,0.85)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200/95">{activeAiModal.title}</p>
            {activeAiModal.subtitle ? (<p className="mt-2 text-sm font-semibold leading-snug text-white/95">{activeAiModal.subtitle}</p>) : null}
            <p className="mt-2 text-[10px] text-white/60">Exit AI decision popup — acknowledge to continue.</p>
            <button type="button" onClick={dismissAiModal} className="sigflo-pressable mt-3 w-full rounded-xl border border-violet-300/35 bg-violet-500/20 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100 shadow-[0_10px_26px_-12px_rgba(167,139,250,0.55)] transition hover:bg-violet-500/30">
              Acknowledge
            </button>
          </div>
        </div>) : null}
    </>);
}
