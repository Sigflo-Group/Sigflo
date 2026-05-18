"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySignalQualityControls = applySignalQualityControls;
function signalKey(candidate) {
    return "".concat(candidate.symbol, ":").concat(candidate.setupType);
}
function shouldEmitByDedup(candidate, previous, cfg) {
    if (!previous)
        return true;
    var cooldownElapsed = candidate.timestamp - previous.lastEmittedAt >= cfg.cooldownMs;
    var materiallyImproved = candidate.setupScore - previous.lastSetupScore >= cfg.minScoreImprovement;
    return cooldownElapsed || materiallyImproved;
}
function applySignalQualityControls(candidates, previousState, cfg) {
    var nextState = __assign({}, previousState);
    var accepted = [];
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var candidate = candidates_1[_i];
        if (!candidate.confirmedOnClosedCandle)
            continue;
        if (candidate.setupScore < cfg.minSetupScore)
            continue;
        var key = signalKey(candidate);
        var previous = nextState[key];
        if (!shouldEmitByDedup(candidate, previous, cfg))
            continue;
        accepted.push(candidate);
        nextState[key] = {
            lastEmittedAt: candidate.timestamp,
            lastSetupScore: candidate.setupScore,
        };
    }
    return { accepted: accepted, nextState: nextState };
}
