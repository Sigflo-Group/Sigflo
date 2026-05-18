"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryBandPrices = entryBandPrices;
exports.targetBandPrices = targetBandPrices;
exports.pctToLevel = pctToLevel;
exports.stopProximityBoost = stopProximityBoost;
exports.targetProximityBoost = targetProximityBoost;
/** Half-width of entry band as a fraction of entry→stop distance (clamped). */
var BAND_FRAC = 0.08;
var BAND_MIN_PCT = 0.06;
var BAND_MAX_PCT = 0.35;
function entryBandPrices(entry, stop) {
    var span = Math.abs(entry - stop);
    var half = Math.min(Math.max(span * BAND_FRAC, entry * (BAND_MIN_PCT / 100)), entry * (BAND_MAX_PCT / 100));
    return { lo: entry - half, hi: entry + half };
}
function targetBandPrices(target, entry, stop) {
    var ref = Math.max(Math.abs(target - entry), Math.abs(entry - stop) * 0.2, target * 0.0008);
    /** Was 0.35 — bands dominated the pane; ~0.14 keeps a readable exit zone without swallowing the chart. */
    var half = ref * 0.14;
    return { lo: target - half, hi: target + half };
}
/** % distance from last to level (signed: long stop below = negative when last above stop). */
function pctToLevel(last, level, ref) {
    if (!(ref > 0))
        return 0;
    return ((last - level) / ref) * 100;
}
function stopProximityBoost(last, stop, entry) {
    var ref = Math.abs(entry) > 0 ? Math.abs(entry) : 1;
    var d = Math.abs(last - stop) / ref;
    if (d < 0.002)
        return 1;
    if (d < 0.004)
        return 0.85;
    if (d < 0.008)
        return 0.65;
    return 0.45;
}
function targetProximityBoost(last, target, entry) {
    var ref = Math.abs(entry) > 0 ? Math.abs(entry) : 1;
    var d = Math.abs(last - target) / ref;
    if (d < 0.003)
        return 1;
    if (d < 0.006)
        return 0.8;
    return 0.55;
}
