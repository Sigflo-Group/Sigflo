"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uiSignalStateFromMarketStatus = uiSignalStateFromMarketStatus;
exports.uiSignalStateLabel = uiSignalStateLabel;
exports.uiSignalStateClasses = uiSignalStateClasses;
exports.postedAgoToSeconds = postedAgoToSeconds;
exports.formatElapsedAgo = formatElapsedAgo;
function uiSignalStateFromMarketStatus(status) {
    if (status === 'triggered')
        return 'triggered';
    if (status === 'developing' || status === 'overextended')
        return 'in_play';
    return 'setup_forming';
}
function uiSignalStateLabel(state) {
    if (state === 'triggered')
        return 'Triggered';
    if (state === 'in_play')
        return 'In Play';
    return 'Setup forming';
}
function uiSignalStateClasses(state) {
    if (state === 'triggered') {
        return {
            dot: 'bg-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.58)]',
            text: 'text-[#7fffe0]',
            pill: 'border-[#00ffc8]/40 bg-[#00ffc8]/16 text-[#7fffe0] shadow-[0_0_16px_-10px_rgba(0,255,200,0.8)]',
            card: 'border-[rgba(0,255,200,0.56)] shadow-[0_18px_38px_-18px_rgba(0,255,200,0.72)] ring-1 ring-[rgba(0,255,200,0.3)]',
            pulse: true,
        };
    }
    if (state === 'in_play') {
        return {
            dot: 'bg-cyan-300/95',
            text: 'text-cyan-200',
            pill: 'border-cyan-300/30 bg-cyan-400/[0.1] text-cyan-100',
            card: 'border-cyan-400/24 ring-1 ring-cyan-400/12 hover:border-cyan-300/30',
            pulse: false,
        };
    }
    return {
        dot: 'bg-slate-500',
        text: 'text-slate-400',
        pill: 'border-slate-400/18 bg-slate-500/[0.07] text-slate-400',
        card: 'border-white/[0.04] opacity-[0.84] hover:border-white/[0.07]',
        pulse: false,
    };
}
function postedAgoToSeconds(postedAgo) {
    var v = postedAgo.trim().toLowerCase();
    if (v === 'live' || v === 'just now')
        return 12;
    var s = /^(\d+)\s*s/.exec(v);
    if (s)
        return Number(s[1]);
    var m = /^(\d+)\s*m/.exec(v);
    if (m)
        return Number(m[1]) * 60;
    var h = /^(\d+)\s*h/.exec(v);
    if (h)
        return Number(h[1]) * 3600;
    return 0;
}
function formatElapsedAgo(seconds) {
    if (seconds < 60)
        return "".concat(seconds, "s ago");
    if (seconds < 3600)
        return "".concat(Math.floor(seconds / 60), "m ago");
    return "".concat(Math.floor(seconds / 3600), "h ago");
}
