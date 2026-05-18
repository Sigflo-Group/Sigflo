"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCANNER_LIFECYCLE_CONFIG = void 0;
exports.SCANNER_LIFECYCLE_CONFIG = {
    historyLimit: 10,
    readyTimingMin: 58,
    triggeredActionabilityMin: 64,
    triggeredFreshnessMin: 55,
    extendedAfterCandles: 3,
    expiredAfterCandles: 5,
    expiredViabilityFloor: 40,
    timingDropFromPeakToExtend: 14,
    atrExtensionWarning: 0.9,
    atrExtensionHard: 1.5,
    percentExtensionWarning: 0.8,
    percentExtensionHard: 1.8,
    minRoomToTargetAtr: 0.9,
    oversizedBreakoutCandleAtr: 1.6,
    actionabilityWeights: {
        setupScore: 0.35,
        timingScore: 0.3,
        entryFreshnessScore: 0.25,
        roomToTargetScore: 0.1,
    },
    penaltyWeights: {
        candlesLatePenalty: 0.2,
        atrExtensionPenalty: 0.24,
        percentExtensionPenalty: 0.16,
        postTriggerImpulsePenalty: 0.14,
        crowdedLevelPenalty: 0.12,
        rrCompressionPenalty: 0.14,
    },
};
