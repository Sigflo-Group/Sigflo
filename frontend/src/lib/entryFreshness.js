"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyPenaltyBreakdown = emptyPenaltyBreakdown;
exports.sumPenalties = sumPenalties;
exports.buildPenaltyBreakdown = buildPenaltyBreakdown;
exports.computeEntryFreshnessScore = computeEntryFreshnessScore;
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function emptyPenaltyBreakdown() {
    return {
        candlesLatePenalty: 0,
        atrExtensionPenalty: 0,
        percentExtensionPenalty: 0,
        postTriggerImpulsePenalty: 0,
        crowdedLevelPenalty: 0,
        rrCompressionPenalty: 0,
    };
}
function sumPenalties(p) {
    return (p.candlesLatePenalty +
        p.atrExtensionPenalty +
        p.percentExtensionPenalty +
        p.postTriggerImpulsePenalty +
        p.crowdedLevelPenalty +
        p.rrCompressionPenalty);
}
function buildPenaltyBreakdown(args) {
    var p = emptyPenaltyBreakdown();
    var config = args.config;
    if (args.candlesSinceTrigger != null) {
        p.candlesLatePenalty = clamp((args.candlesSinceTrigger - 1) * 7, 0, 28);
    }
    p.atrExtensionPenalty = clamp(((Math.max(0, args.atrExtensionFromIdeal - config.atrExtensionWarning) /
        Math.max(0.001, config.atrExtensionHard - config.atrExtensionWarning)) *
        28), 0, 28);
    p.percentExtensionPenalty = clamp(((Math.max(0, args.pctExtensionFromIdeal - config.percentExtensionWarning) /
        Math.max(0.001, config.percentExtensionHard - config.percentExtensionWarning)) *
        20), 0, 20);
    p.postTriggerImpulsePenalty = clamp(args.postTriggerImpulseCandles * 5, 0, 20);
    p.crowdedLevelPenalty = args.roomToTargetScore < 35 ? clamp((35 - args.roomToTargetScore) * 0.45, 0, 16) : 0;
    p.rrCompressionPenalty = args.roomToTargetScore < 45 ? clamp((45 - args.roomToTargetScore) * 0.3, 0, 14) : 0;
    return p;
}
function computeEntryFreshnessScore(penalties) {
    return clamp(Math.round(100 - sumPenalties(penalties)), 0, 100);
}
