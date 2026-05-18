"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETUP_BAND_SHORT_ORDER = void 0;
exports.setupBandShortFromFullLabel = setupBandShortFromFullLabel;
exports.setupBandDockEmphasisClass = setupBandDockEmphasisClass;
exports.setupBandDockEmphasisClassFromFullLabel = setupBandDockEmphasisClassFromFullLabel;
exports.setupBandDockCompactLabel = setupBandDockCompactLabel;
/**
 * Short band names from `setupScoreBandShort` — single source for setup-tier colours.
 * Order: best → worst, then structural risk override.
 */
exports.SETUP_BAND_SHORT_ORDER = [
    'Elite',
    'Strong',
    'Developing',
    'Low',
    'Avoid',
    'Risky / Exhausted',
];
function isSetupBandShort(s) {
    return exports.SETUP_BAND_SHORT_ORDER.includes(s);
}
/** Map full score labels (e.g. `Strong setup`) to the same short key as the dock. */
function setupBandShortFromFullLabel(full) {
    return String(full)
        .replace(/\s+setup$/i, '')
        .replace(/\s+quality$/i, '');
}
/**
 * Dense-row emphasis: text + soft glow. Used in the price-chart dock; tune here for app-wide consistency.
 */
var DOCK_EMPHASIS = {
    Elite: 'font-semibold text-amber-200/95 [text-shadow:0_0_6px_rgba(251,191,36,0.55),0_0_14px_rgba(245,158,11,0.3)]',
    Strong: 'font-semibold text-emerald-200/95 [text-shadow:0_0_6px_rgba(52,211,153,0.55),0_0_14px_rgba(34,197,94,0.32)]',
    Developing: 'font-semibold text-sky-200/95 [text-shadow:0_0_6px_rgba(56,189,248,0.48),0_0_14px_rgba(14,165,233,0.28)]',
    Low: 'font-semibold text-orange-200/95 [text-shadow:0_0_6px_rgba(251,146,60,0.5),0_0_14px_rgba(234,88,12,0.26)]',
    Avoid: 'font-semibold text-rose-200/95 [text-shadow:0_0_6px_rgba(251,113,133,0.52),0_0_14px_rgba(244,63,94,0.28)]',
    'Risky / Exhausted': 'font-semibold text-fuchsia-200/95 [text-shadow:0_0_6px_rgba(232,121,249,0.45),0_0_14px_rgba(192,38,211,0.28)]',
};
var DOCK_FALLBACK = 'font-semibold text-white/82';
function setupBandDockEmphasisClass(bandShort) {
    if (isSetupBandShort(bandShort))
        return DOCK_EMPHASIS[bandShort];
    return DOCK_FALLBACK;
}
/** When you only have the full `setupScoreLabel` string from data. */
function setupBandDockEmphasisClassFromFullLabel(full) {
    return setupBandDockEmphasisClass(setupBandShortFromFullLabel(full));
}
/** Chart dock grid only — keeps the 2×2 box narrow so the row fits before the collapse chevron. */
function setupBandDockCompactLabel(bandShort) {
    if (bandShort === 'Risky / Exhausted')
        return 'Risky/exh.';
    return bandShort;
}
