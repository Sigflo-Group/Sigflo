"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSetupScore = calculateSetupScore;
exports.getSetupScoreLabel = getSetupScoreLabel;
exports.displaySetupScoreCaption = displaySetupScoreCaption;
exports.setupScoreBandShort = setupScoreBandShort;
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function calculateSetupScore(b) {
    var trend = clamp(b.trendAlignment, 0, 25);
    var momentum = clamp(b.momentumQuality, 0, 20);
    var structure = clamp(b.structureQuality, 0, 25);
    var volume = clamp(b.volumeConfirmation, 0, 15);
    var risk = clamp(b.riskConditions, 0, 15);
    return Math.min(100, trend + momentum + structure + volume + risk);
}
function getSetupScoreLabel(score) {
    if (score >= 85)
        return 'Elite setup';
    if (score >= 70)
        return 'Strong setup';
    if (score >= 55)
        return 'Developing';
    if (score >= 40)
        return 'Low quality';
    return 'Avoid';
}
/** UI caption: structural state (overextended) overrides the numeric score band label. */
function displaySetupScoreCaption(signal, opts) {
    if (signal.setupType === 'overextended' || (opts === null || opts === void 0 ? void 0 : opts.rowOverextended)) {
        return 'Risky / Exhausted';
    }
    return signal.setupScoreLabel;
}
/** Compact band for headers, e.g. "Strong" from Strong setup. */
function setupScoreBandShort(signal) {
    if (signal.setupType === 'overextended')
        return 'Risky / Exhausted';
    var full = getSetupScoreLabel(signal.setupScore);
    return full.replace(/\s+setup$/i, '').replace(/\s+quality$/i, '');
}
