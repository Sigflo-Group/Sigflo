"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTradeEntryGuidance = computeTradeEntryGuidance;
var tradeTimingChip_1 = require("@/lib/tradeTimingChip");
var tradeSetupExecutionModel_1 = require("@/lib/tradeSetupExecutionModel");
/**
 * Pre-entry (and in-position) copy for the scenario strip — uses setup/execution split
 * ({@link buildTradeTimingUiModel}) so fills are not mislabeled as “Weak timing”.
 */
function computeTradeEntryGuidance(args) {
    var _a;
    var ui = (0, tradeSetupExecutionModel_1.buildTradeTimingUiModel)({
        inPosition: args.hasOpenPosition,
        marketStatus: args.marketStatus,
        executionQuality: (_a = args.executionQuality) !== null && _a !== void 0 ? _a : null,
    });
    var blend = (0, tradeTimingChip_1.blendTimingReadinessScore)(args.setupScore, args.tradeScore) / 100;
    var confidenceLabel = 'Medium';
    if (blend > 0.62)
        confidenceLabel = 'High';
    else if (blend < 0.42)
        confidenceLabel = 'Low';
    var executionSummary = args.hasOpenPosition && args.executionQuality != null
        ? "Execution: ".concat(args.executionQuality === 'strong' ? 'Strong' : args.executionQuality === 'okay' ? 'Okay' : 'Weak', " \u2014 ").concat((0, tradeSetupExecutionModel_1.executionQualityExplanation)(args.executionQuality))
        : null;
    if (args.hasOpenPosition) {
        return {
            timingState: ui.chipState,
            timingLabel: ui.chipLabel,
            timingHelperText: ui.helperText,
            executionSummary: executionSummary,
            action: 'Entry is live — focus on path, size, and invalidation vs your plan.',
            reason: args.executionQuality === 'weak'
                ? 'Entered after optimal range — late entry reduced trade quality; manage risk tightly vs your stop.'
                : 'Focus on tape vs stop/target; add size only when structure still matches the thesis and your safeguards allow.',
            confidenceLabel: confidenceLabel,
        };
    }
    var action;
    var reason;
    switch (ui.setupState) {
        case 'triggered':
            action = 'Entry window is open — prefer limits or scaled bids near plan entry; avoid chasing spikes.';
            reason = 'This is the first actionable moment for this setup on the scanner timeline.';
            break;
        case 'building':
            action = 'Let the setup finish — wait for confirmation before committing size.';
            reason = 'Structure is still forming; early size increases variance.';
            break;
        default:
            action = 'Watch your levels; size only when your rules are satisfied.';
            reason = 'Patience beats forcing entries.';
    }
    if (ui.chipState === 'invalid') {
        action = 'Stand down or cut intended size until risk posture improves.';
        reason = 'Extension or late-setup risk suggests poor risk/reward for fresh entries here.';
    }
    if (args.planEntry > 0 && args.lastPrice > 0) {
        var gapPct = ((args.side === 'long' ? args.lastPrice - args.planEntry : args.planEntry - args.lastPrice) /
            args.planEntry) *
            100;
        if (Number.isFinite(gapPct) && Math.abs(gapPct) > 0.08) {
            reason += " Last is ".concat(gapPct >= 0 ? '+' : '').concat(gapPct.toFixed(2), "% vs plan entry.");
        }
    }
    return {
        timingState: ui.chipState,
        timingLabel: ui.chipLabel,
        timingHelperText: ui.helperText,
        executionSummary: null,
        action: action,
        reason: reason,
        confidenceLabel: confidenceLabel,
    };
}
