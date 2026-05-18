"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScannerDeterminismCheck = runScannerDeterminismCheck;
var scannerPipeline_1 = require("@/engine/scannerPipeline");
var scannerFixtures_1 = require("@/engine/scannerFixtures");
function toFrame(run, accepted, allCandidates) {
    return {
        run: run,
        acceptedCount: accepted.length,
        candidateCount: allCandidates.length,
        accepted: accepted.map(function (s) { return ({
            symbol: s.symbol,
            setupType: s.setupType,
            setupScore: s.setupScore,
            tags: s.tags,
        }); }),
    };
}
/**
 * Deterministic dry-run for local development (scanner pipeline + filter state).
 * - Run 1: emits valid signals
 * - Run 2: cooldown / dedup behavior
 */
function runScannerDeterminismCheck() {
    var marketBySymbol = (0, scannerFixtures_1.buildScannerLabFixtureInput)();
    var first = (0, scannerPipeline_1.runScannerPipeline)({
        marketBySymbol: marketBySymbol,
        filterConfig: { minSetupScore: 55, cooldownMs: 45 * 60 * 1000, minScoreImprovement: 8 },
    });
    var state = first.nextState;
    var second = (0, scannerPipeline_1.runScannerPipeline)({
        marketBySymbol: marketBySymbol,
        previousState: state,
        filterConfig: { minSetupScore: 55, cooldownMs: 45 * 60 * 1000, minScoreImprovement: 8 },
    });
    return {
        firstPass: toFrame(1, first.acceptedSignals, first.allCandidates),
        secondPass: toFrame(2, second.acceptedSignals, second.allCandidates),
    };
}
