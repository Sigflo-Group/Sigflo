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
exports.formatShortAgo = formatShortAgo;
exports.buildLatestActivityLine = buildLatestActivityLine;
function formatShortAgo(seconds) {
    if (!Number.isFinite(seconds))
        return '—';
    if (seconds < 60)
        return "".concat(Math.max(1, Math.round(seconds)), "s ago");
    var min = Math.round(seconds / 60);
    if (min < 60)
        return "".concat(min, "m ago");
    var hr = Math.round(min / 60);
    return "".concat(hr, "h ago");
}
/** One-line “latest activity” from the freshest meaningful opportunity. */
function buildLatestActivityLine(opportunities) {
    var _a, _b, _c, _d;
    if (!opportunities.length)
        return null;
    var sorted = __spreadArray([], opportunities, true).sort(function (a, b) { return a.freshnessSec - b.freshnessSec; });
    var focus = (_b = (_a = sorted.find(function (o) { return o.state === 'Ready' || o.state === 'Triggered'; })) !== null && _a !== void 0 ? _a : sorted.find(function (o) { return o.state === 'Building'; })) !== null && _b !== void 0 ? _b : sorted[0];
    if (!focus)
        return null;
    var short = (_d = (_c = focus.pair
        .replace(/\s*\/\s*/g, '/')
        .split('/')[0]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : focus.pair;
    var ago = formatShortAgo(focus.freshnessSec);
    if (focus.state === 'Ready') {
        return "".concat(short, " upgraded to Ready ").concat(ago);
    }
    if (focus.state === 'Triggered') {
        return "".concat(short, " triggered ").concat(ago);
    }
    return "".concat(short, " \u00B7 ").concat(focus.state, " ").concat(ago);
}
