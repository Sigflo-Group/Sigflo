"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExitGuidanceFlow = resolveExitGuidanceFlow;
var aiExitAutomation_1 = require("@/lib/aiExitAutomation");
var exitGuidance_1 = require("@/lib/exitGuidance");
function resolveExitGuidanceFlow(input) {
    var lastPrice;
    var pnlPct;
    if (input.variant === 'trade') {
        pnlPct = input.estimatedPnlPct;
        lastPrice =
            input.side === 'long'
                ? input.entry * (1 + input.estimatedPnlPct / 100)
                : input.entry * (1 - input.estimatedPnlPct / 100);
    }
    else {
        pnlPct = input.pnlPct;
        lastPrice = input.mark;
    }
    var raw = (0, exitGuidance_1.computeExitGuidance)({
        side: input.side,
        entry: input.entry,
        lastPrice: lastPrice,
        stop: input.stop,
        target: input.target,
        trendAlignment: input.trendAlignment,
        momentumQuality: input.momentumQuality,
        pnlPct: pnlPct,
        strategyPreset: input.strategyPreset,
        customStrategyThresholds: input.customStrategyThresholds,
    });
    var effective = (0, aiExitAutomation_1.applySafeguardsToGuidance)(raw, pnlPct, input.safeguards, input.stop, input.target, input.side);
    var nextPlanned = (0, aiExitAutomation_1.nextPlannedAutomationLine)({
        mode: input.exitAiMode,
        guidance: effective,
        safeguards: input.safeguards,
        pnlPct: pnlPct,
    });
    return { raw: raw, effective: effective, nextPlanned: nextPlanned, pnlPct: pnlPct, lastPrice: lastPrice };
}
