"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreToUnit = scoreToUnit;
exports.computeActionabilityScore = computeActionabilityScore;
function clamp01(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.max(0, Math.min(1, n));
}
function scoreToUnit(n) {
    return clamp01(n / 100);
}
function computeActionabilityScore(args, weights) {
    var sum = scoreToUnit(args.setupScore) * weights.setupScore +
        scoreToUnit(args.timingScore) * weights.timingScore +
        scoreToUnit(args.entryFreshnessScore) * weights.entryFreshnessScore +
        scoreToUnit(args.roomToTargetScore) * weights.roomToTargetScore;
    return Math.round(clamp01(sum) * 100);
}
