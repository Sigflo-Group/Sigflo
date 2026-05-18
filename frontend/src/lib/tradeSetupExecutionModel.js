"use strict";
/**
 * Trade readiness: **setup state** (Building / Triggered / In position) vs **execution quality**
 * (Strong / Okay / Weak) after fill. Replaces overloaded timing labels that mixed scanner lifecycle
 * with risk-adjusted trade score (which wrongly showed “Weak timing” immediately after entry).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.directionalEntryAdverseDeviationPct = directionalEntryAdverseDeviationPct;
exports.getSetupDisplayState = getSetupDisplayState;
exports.getExecutionTradeScorePenalty = getExecutionTradeScorePenalty;
exports.getExecutionQuality = getExecutionQuality;
exports.executionQualityExplanation = executionQualityExplanation;
exports.buildTradeTimingUiModel = buildTradeTimingUiModel;
exports.resolveIdealEntryForExecution = resolveIdealEntryForExecution;
var tradeSetupExecution_1 = require("@/config/tradeSetupExecution");
/** Adverse move vs ideal: long = paid higher than ideal (worse); short = sold lower (worse). */
function directionalEntryAdverseDeviationPct(side, actualEntry, idealEntry) {
    if (!(idealEntry > 0) || !Number.isFinite(actualEntry))
        return Number.POSITIVE_INFINITY;
    if (side === 'long')
        return ((actualEntry - idealEntry) / idealEntry) * 100;
    return ((idealEntry - actualEntry) / idealEntry) * 100;
}
function getSetupDisplayState(args) {
    if (args.inPosition)
        return 'in_position';
    if (args.marketStatus === 'triggered')
        return 'triggered';
    return 'building';
}
function getExecutionTradeScorePenalty(quality) {
    if (!quality)
        return 0;
    if (quality === 'strong')
        return 0;
    if (quality === 'okay')
        return 3;
    return 8;
}
/**
 * Execution grade after open — independent of timing chip / setup row state.
 * Grace: if `openedAtMs <= triggerLock.lockedAtMs + GRACE`, never Weak (Okay minimum).
 */
function getExecutionQuality(args) {
    if (!args.inPosition)
        return null;
    if (!(args.actualEntry > 0) || !(args.idealEntry > 0))
        return 'okay';
    var graceEndMs = args.triggerLock != null ? args.triggerLock.lockedAtMs + tradeSetupExecution_1.SETUP_TRIGGER_GRACE_WINDOW_MS : null;
    var withinGrace = graceEndMs != null && args.openedAtMs != null && args.openedAtMs <= graceEndMs;
    var adversePct = directionalEntryAdverseDeviationPct(args.side, args.actualEntry, args.idealEntry);
    if (withinGrace) {
        if (adversePct <= tradeSetupExecution_1.EXECUTION_STRONG_MAX_ADVERSE_DEVIATION_PCT)
            return 'strong';
        return 'okay';
    }
    if (adversePct <= tradeSetupExecution_1.EXECUTION_STRONG_MAX_ADVERSE_DEVIATION_PCT)
        return 'strong';
    if (adversePct <= tradeSetupExecution_1.EXECUTION_OKAY_MAX_ADVERSE_DEVIATION_PCT)
        return 'okay';
    return 'weak';
}
function executionQualityExplanation(quality) {
    switch (quality) {
        case 'strong':
            return 'Filled near plan entry.';
        case 'okay':
            return 'Acceptable fill vs plan.';
        case 'weak':
            return 'Entered after optimal range — late entry reduced trade quality.';
        default:
            return '';
    }
}
/**
 * Dock / scanner timing presentation — setup-only before entry; execution line only in position.
 */
function buildTradeTimingUiModel(args) {
    var inPosition = args.inPosition, marketStatus = args.marketStatus, executionQuality = args.executionQuality;
    if (!inPosition && (marketStatus === 'overextended' || marketStatus === 'extended')) {
        var chipLabel = marketStatus === 'extended' ? 'Late setup' : 'Stretched';
        return {
            setupState: 'building',
            chipLabel: chipLabel,
            chipState: 'invalid',
            helperText: 'Poor risk/reward for fresh entries here.',
            executionQuality: null,
            executionLabel: null,
            executionHelperText: null,
            overlayTimingState: 'invalid',
        };
    }
    if (inPosition) {
        var execLabel = executionQuality != null
            ? "Execution: ".concat(executionQuality === 'strong' ? 'Strong' : executionQuality === 'okay' ? 'Okay' : 'Weak')
            : null;
        return {
            setupState: 'in_position',
            chipLabel: 'In position',
            chipState: 'ready',
            helperText: 'Manage risk vs your plan.',
            executionQuality: executionQuality,
            executionLabel: execLabel,
            executionHelperText: executionQuality != null ? executionQualityExplanation(executionQuality) : null,
            overlayTimingState: 'ready',
        };
    }
    if (marketStatus === 'triggered') {
        return {
            setupState: 'triggered',
            chipLabel: 'Triggered',
            chipState: 'ready',
            helperText: 'Entry window open.',
            executionQuality: null,
            executionLabel: null,
            executionHelperText: null,
            overlayTimingState: 'ready',
        };
    }
    return {
        setupState: 'building',
        chipLabel: 'Building',
        chipState: 'developing',
        helperText: 'Watch for trigger.',
        executionQuality: null,
        executionLabel: null,
        executionHelperText: null,
        overlayTimingState: 'developing',
    };
}
/** Ideal entry reference for execution: prefer locked trigger, then signal, then plan anchor. */
function resolveIdealEntryForExecution(args) {
    var _a;
    var fromLock = (_a = args.triggerLock) === null || _a === void 0 ? void 0 : _a.idealEntry;
    if (fromLock != null && Number.isFinite(fromLock) && fromLock > 0)
        return fromLock;
    var ideal = args.signal.idealEntryPrice;
    if (ideal != null && Number.isFinite(ideal) && ideal > 0)
        return ideal;
    if (Number.isFinite(args.planEntry) && args.planEntry > 0)
        return args.planEntry;
    var lp = args.lastPrice;
    if (lp != null && Number.isFinite(lp) && lp > 0)
        return lp;
    return args.planEntry;
}
