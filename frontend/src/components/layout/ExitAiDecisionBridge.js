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
exports.ExitAiDecisionBridge = ExitAiDecisionBridge;
var react_1 = require("react");
var globalAnnouncements_1 = require("@/lib/globalAnnouncements");
var TRADE_ACTIVITY_KEY = 'sigflo.exitAi.activity.trade';
var SEEN_CACHE_KEY = 'sigflo.exitAi.popupSeen.v1';
var POPUP_KINDS = new Set([
    'assisted_ready',
    'auto_trim',
    'auto_close',
    'safeguard',
]);
function readActivityLog() {
    try {
        var raw = window.localStorage.getItem(TRADE_ACTIVITY_KEY);
        if (!raw)
            return [];
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(function (row) {
            if (!row || typeof row !== 'object')
                return false;
            var r = row;
            return (typeof r.id === 'string' &&
                typeof r.kind === 'string' &&
                typeof r.message === 'string' &&
                typeof r.ts === 'number');
        });
    }
    catch (_a) {
        return [];
    }
}
function readSeenSet() {
    try {
        var raw = window.sessionStorage.getItem(SEEN_CACHE_KEY);
        if (!raw)
            return new Set();
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return new Set();
        return new Set(parsed.filter(function (v) { return typeof v === 'string'; }));
    }
    catch (_a) {
        return new Set();
    }
}
function persistSeenSet(ids) {
    try {
        var arr = __spreadArray([], ids, true);
        var trimmed = arr.slice(-300);
        window.sessionStorage.setItem(SEEN_CACHE_KEY, JSON.stringify(trimmed));
    }
    catch (_a) {
        /* ignore */
    }
}
function ExitAiDecisionBridge() {
    var seenRef = (0, react_1.useRef)(new Set());
    (0, react_1.useEffect)(function () {
        seenRef.current = readSeenSet();
    }, []);
    (0, react_1.useEffect)(function () {
        var publishNew = function () {
            var now = Date.now();
            var seen = seenRef.current;
            var dirty = false;
            for (var _i = 0, _a = readActivityLog(); _i < _a.length; _i++) {
                var e = _a[_i];
                if (!POPUP_KINDS.has(e.kind))
                    continue;
                if (seen.has(e.id))
                    continue;
                // Do not replay very old events after reload.
                if (e.ts < now - 10 * 60000) {
                    seen.add(e.id);
                    dirty = true;
                    continue;
                }
                seen.add(e.id);
                dirty = true;
                (0, globalAnnouncements_1.emitGlobalAnnouncement)({
                    id: "exit-activity-".concat(e.id),
                    kind: 'ai_action',
                    title: e.kind === 'assisted_ready' ? 'Assisted Exit Confirmation Required' : 'Auto Exit AI Decision',
                    subtitle: e.message,
                    createdAt: e.ts,
                });
            }
            if (dirty)
                persistSeenSet(seen);
        };
        publishNew();
        var intervalId = window.setInterval(publishNew, 1200);
        var onStorage = function (ev) {
            if (ev.key === TRADE_ACTIVITY_KEY)
                publishNew();
        };
        window.addEventListener('storage', onStorage);
        return function () {
            window.clearInterval(intervalId);
            window.removeEventListener('storage', onStorage);
        };
    }, []);
    return null;
}
