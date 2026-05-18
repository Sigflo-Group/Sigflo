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
exports.getOpportunities = getOpportunities;
exports.getOpportunityById = getOpportunityById;
var mockMarketSnapshots_1 = require("@/services/engine/mockMarketSnapshots");
var mockDetectors_1 = require("@/services/engine/mockDetectors");
var opportunityNormalizer_1 = require("@/services/engine/opportunityNormalizer");
var opportunityConfidenceDecay_1 = require("@/lib/opportunityConfidenceDecay");
var DETECTORS = [
    mockDetectors_1.runBreakoutDetector,
    mockDetectors_1.runReversalDetector,
    mockDetectors_1.runMomentumDetector,
    mockDetectors_1.runTrendPullbackDetector,
];
/** Priority order for the demo engine output list (then score descending). */
var ENGINE_STATE_SORT_RANK = {
    Triggered: 0,
    Ready: 1,
    Managing: 2,
    Building: 3,
    Watching: 4,
    CoolingOff: 5,
    Invalidated: 6,
    Completed: 7,
};
function sortEngineOpportunities(list) {
    return __spreadArray([], list, true).sort(function (a, b) {
        var _a, _b;
        var ra = (_a = ENGINE_STATE_SORT_RANK[a.state]) !== null && _a !== void 0 ? _a : 99;
        var rb = (_b = ENGINE_STATE_SORT_RANK[b.state]) !== null && _b !== void 0 ? _b : 99;
        if (ra !== rb)
            return ra - rb;
        if (b.score !== a.score)
            return b.score - a.score;
        return a.freshnessSec - b.freshnessSec;
    });
}
function pairKey(pair) {
    return pair.replace(/[/\s]/g, '').toUpperCase();
}
/** One opportunity per underlying pair — keep highest score to avoid detector spam. */
function dedupeByPairBestScore(outputs) {
    var best = new Map();
    for (var _i = 0, outputs_1 = outputs; _i < outputs_1.length; _i++) {
        var o = outputs_1[_i];
        var k = pairKey(o.pair);
        var prev = best.get(k);
        if (!prev || o.score > prev.score)
            best.set(k, o);
    }
    return __spreadArray([], best.values(), true);
}
function buildOpportunitiesFromEngine() {
    var detectorOutputs = [];
    for (var _i = 0, mockMarketSnapshots_2 = mockMarketSnapshots_1.mockMarketSnapshots; _i < mockMarketSnapshots_2.length; _i++) {
        var snapshot = mockMarketSnapshots_2[_i];
        for (var _a = 0, DETECTORS_1 = DETECTORS; _a < DETECTORS_1.length; _a++) {
            var run = DETECTORS_1[_a];
            var out = run(snapshot);
            if (out)
                detectorOutputs.push(out);
        }
    }
    var deduped = dedupeByPairBestScore(detectorOutputs);
    if (import.meta.env.DEV) {
        console.debug('[Sigflo engine]', "snapshots=".concat(mockMarketSnapshots_1.mockMarketSnapshots.length), "detectorOutputs=".concat(detectorOutputs.length), "opportunities=".concat(deduped.length));
    }
    return sortEngineOpportunities(deduped.map(function (out) { return (0, opportunityConfidenceDecay_1.applyOpportunityConfidenceDecay)((0, opportunityNormalizer_1.normalizeDetectorOutput)(out)); }));
}
var cachedOpportunities = null;
function getOpportunities() {
    if (!cachedOpportunities)
        cachedOpportunities = buildOpportunitiesFromEngine();
    return cachedOpportunities;
}
function getOpportunityById(id) {
    var key = id.trim();
    if (!key)
        return undefined;
    return getOpportunities().find(function (o) { return o.id === key; });
}
