"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionMicroInsight = positionMicroInsight;
/**
 * Sigflo-style read on a position — tape + range + PnL%, not exchange chrome.
 */
function positionMicroInsight(leg, current, pnlPct, ticker) {
    var _a;
    var absPct = Math.abs(pnlPct);
    var tape = (_a = ticker === null || ticker === void 0 ? void 0 : ticker.price24hPcnt) !== null && _a !== void 0 ? _a : 0;
    var hi = ticker === null || ticker === void 0 ? void 0 : ticker.high24h;
    var lo = ticker === null || ticker === void 0 ? void 0 : ticker.low24h;
    var rangePos = hi && lo && hi > lo ? (current - lo) / (hi - lo) : null;
    if (absPct < 0.45) {
        return 'Weak move — low conviction';
    }
    if (leg.side === 'long' && rangePos !== null && rangePos >= 0.78 && pnlPct < 2.5 && pnlPct > -1) {
        return 'Stalling near resistance';
    }
    if (leg.side === 'short' && rangePos !== null && rangePos <= 0.24 && pnlPct < 2.5 && pnlPct > -1) {
        return 'Stalling near support — bounce risk';
    }
    if (leg.side === 'long' && tape >= 0.012 && pnlPct >= 1) {
        return 'Momentum strong';
    }
    if (leg.side === 'short' && tape <= -0.012 && pnlPct >= 1) {
        return 'Momentum strong';
    }
    if (pnlPct >= 2.8) {
        return 'Momentum strong';
    }
    if (pnlPct <= -2.5) {
        return 'Tape working against you — cut or define risk';
    }
    if (pnlPct >= 0.5 && pnlPct < 2.8) {
        return 'Trend still intact — don’t over-manage';
    }
    if (pnlPct <= -0.45 && pnlPct > -2.5) {
        return 'Giving back — tighten if structure breaks';
    }
    return 'Flat tape — wait for clarity';
}
