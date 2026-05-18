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
exports.getScoreTier = getScoreTier;
exports.formatFreshness = formatFreshness;
exports.sortOpportunities = sortOpportunities;
exports.getStateStyles = getStateStyles;
exports.stateLabel = stateLabel;
function getScoreTier(score) {
    if (score >= 85)
        return 'Elite';
    if (score >= 75)
        return 'Strong';
    if (score >= 65)
        return 'Valid';
    if (score >= 55)
        return 'Developing';
    return 'Hidden';
}
function formatFreshness(seconds) {
    if (seconds < 60)
        return "Updated ".concat(Math.max(1, Math.round(seconds)), "s ago");
    var min = Math.round(seconds / 60);
    if (min < 60)
        return "Updated ".concat(min, "m ago");
    var hr = Math.round(min / 60);
    return "Updated ".concat(hr, "h ago");
}
var STATE_ORDER = {
    Triggered: 0,
    Ready: 1,
    Managing: 2,
    Building: 3,
    Watching: 4,
    CoolingOff: 5,
    Invalidated: 6,
    Completed: 7,
};
function sortOpportunities(opportunities) {
    return __spreadArray([], opportunities, true).sort(function (a, b) {
        var _a, _b;
        var rankDiff = ((_a = STATE_ORDER[a.state]) !== null && _a !== void 0 ? _a : 99) - ((_b = STATE_ORDER[b.state]) !== null && _b !== void 0 ? _b : 99);
        if (rankDiff !== 0)
            return rankDiff;
        if (b.score !== a.score)
            return b.score - a.score;
        return a.freshnessSec - b.freshnessSec;
    });
}
function getStateStyles(state) {
    switch (state) {
        case 'Triggered':
        case 'Ready':
            return {
                pill: 'border-emerald-300/35 bg-emerald-500/12 text-emerald-200',
                dot: 'bg-[#00ffc8] animate-pulse',
            };
        case 'Managing':
            return {
                pill: 'border-cyan-300/35 bg-cyan-500/12 text-cyan-200',
                dot: 'bg-cyan-300',
            };
        case 'Building':
        case 'Watching':
            return {
                pill: 'border-white/15 bg-white/[0.05] text-zinc-300',
                dot: 'bg-zinc-400',
            };
        case 'CoolingOff':
            return {
                pill: 'border-amber-300/35 bg-amber-500/10 text-amber-200',
                dot: 'bg-amber-300',
            };
        case 'Completed':
            return {
                pill: 'border-emerald-300/25 bg-emerald-500/8 text-emerald-200/85',
                dot: 'bg-emerald-300/80',
            };
        case 'Invalidated':
            return {
                pill: 'border-rose-300/30 bg-rose-500/10 text-rose-200',
                dot: 'bg-rose-300',
            };
        default:
            return { pill: 'border-white/10 bg-white/[0.04] text-zinc-300', dot: 'bg-zinc-400' };
    }
}
/** UI-friendly state label mapping (keeps backend states stable, copy user-facing). */
function stateLabel(state) {
    if (state === 'Ready')
        return 'Ready now';
    return state;
}
