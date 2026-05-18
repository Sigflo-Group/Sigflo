"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeExitAiPrimaryStatus = computeExitAiPrimaryStatus;
exports.buildActionPreviewLine = buildActionPreviewLine;
exports.buildExitAiCoPilotModel = buildExitAiCoPilotModel;
exports.buildManageAiExitZoneAuxLines = buildManageAiExitZoneAuxLines;
var formatQuote_1 = require("@/lib/formatQuote");
function confidencePctFromLabel(label, state) {
    var base = label === 'High' ? 78 : label === 'Medium' ? 62 : 46;
    if (state === 'trim')
        return Math.max(38, base - 14);
    if (state === 'exit')
        return Math.max(28, base - 22);
    return base;
}
function computeExitAiPrimaryStatus(input) {
    if (input.mode === 'manual')
        return 'manual_plan';
    if (input.orderExitInFlight)
        return 'exit_triggered';
    if (input.assistedPromptVisible)
        return 'preparing_exit';
    var s = input.effectiveState;
    if (s === 'trim')
        return 'scaling_out';
    if (s === 'exit')
        return 'tightening_risk';
    return 'holding';
}
function statusTitleFor(s) {
    switch (s) {
        case 'holding':
            return 'Holding';
        case 'scaling_out':
            return 'Scaling out';
        case 'tightening_risk':
            return 'Tightening risk';
        case 'preparing_exit':
            return 'Preparing exit';
        case 'exit_triggered':
            return 'Exit in progress';
        case 'manual_plan':
        default:
            return 'Manual exits';
    }
}
function panelToneFor(s) {
    switch (s) {
        case 'holding':
            return 'border-teal-500/20 shadow-[0_0_36px_-20px_rgba(45,212,191,0.35)]';
        case 'scaling_out':
            return 'border-amber-400/25 shadow-[0_0_40px_-18px_rgba(251,191,36,0.28)]';
        case 'tightening_risk':
            return 'border-orange-400/28 shadow-[0_0_42px_-18px_rgba(251,146,60,0.3)]';
        case 'preparing_exit':
            return 'border-cyan-400/30 shadow-[0_0_44px_-16px_rgba(34,211,238,0.32)]';
        case 'exit_triggered':
            return 'border-landing-accent/45 shadow-[0_0_48px_-14px_rgba(0,200,120,0.38)] ring-1 ring-landing-accent/35';
        case 'manual_plan':
        default:
            return 'border-white/[0.08] shadow-none';
    }
}
function buildIntentLine(status, mode, g) {
    if (mode === 'manual') {
        return 'You are managing exits; the chart shows your applied stop and target.';
    }
    if (status === 'exit_triggered') {
        return 'Submitting the exit on your exchange — fills usually land within seconds.';
    }
    if (status === 'preparing_exit') {
        if ((g === null || g === void 0 ? void 0 : g.state) === 'trim') {
            return 'Prepared to scale out — confirm when you want to reduce exposure.';
        }
        if ((g === null || g === void 0 ? void 0 : g.state) === 'exit') {
            return 'Prepared to close — confirm when you want to stand aside.';
        }
        return 'Prepared action ready — confirm to execute on the exchange.';
    }
    if (!g) {
        return 'Watching how price behaves versus your plan levels.';
    }
    if (g.state === 'hold') {
        if (g.reason.includes('thesis') || g.reason.includes('Trend')) {
            return 'Holding while trend and momentum still support the trade.';
        }
        if (g.reason.includes('No immediate')) {
            return 'Holding inside the plan — watching for a clean structure break.';
        }
        return 'Holding while the tape stays aligned with the original thesis.';
    }
    if (g.state === 'trim') {
        return 'Protecting gains as price works into the target area.';
    }
    return 'Invalidation risk is rising — favor protection or a tighter stop.';
}
function buildConfidenceLine(status, mode, g) {
    if (mode === 'manual') {
        return 'Exit AI is observational only in manual mode.';
    }
    if (status === 'exit_triggered') {
        return 'Automation stepped aside — execution is in flight.';
    }
    if (!g) {
        return '';
    }
    if (g.state === 'hold') {
        var pct = confidencePctFromLabel(g.confidenceLabel, g.state);
        return "Hold confidence: ".concat(pct, "%");
    }
    if (g.state === 'trim') {
        return 'Exit likelihood: elevated near target';
    }
    return 'Exit likelihood: high near invalidation';
}
function buildActionPreviewLine(input) {
    var mode = input.mode, nextPlanned = input.nextPlanned, g = input.guidance, safeguards = input.safeguards, stop = input.stop, target = input.target;
    if (mode === 'manual') {
        return 'Will surface trim or exit ideas if price presses target or stop.';
    }
    if (!g)
        return nextPlanned;
    var stopS = (0, formatQuote_1.formatQuoteNumber)(stop);
    var tgtS = (0, formatQuote_1.formatQuoteNumber)(target);
    if (nextPlanned.includes('You control exits')) {
        return 'You keep full control — readouts refresh as price moves.';
    }
    if (nextPlanned.includes('No prepared exit')) {
        return 'Will prompt again when the readout shifts from hold.';
    }
    if (nextPlanned.includes('Max loss')) {
        return safeguards.allowFullAutoClose
            ? 'Will favor a full exit if the max-loss safeguard is crossed.'
            : 'Max-loss safeguard is on — auto full close is disabled; watch levels closely.';
    }
    if (nextPlanned.includes('partial auto off')) {
        return 'Near target but partial automation is off — only watching.';
    }
    if (nextPlanned.includes('Will trim')) {
        return "May trim about half the position near $".concat((0, formatQuote_1.formatQuoteNumber)(g.referencePrice), " if conditions hold.");
    }
    if (nextPlanned.includes('Will close fully')) {
        return "May close the remainder near $".concat((0, formatQuote_1.formatQuoteNumber)(g.referencePrice), " if risk stays elevated.");
    }
    if (nextPlanned.includes('tap Confirm')) {
        return g.state === 'trim'
            ? "Will scale out near $".concat((0, formatQuote_1.formatQuoteNumber)(g.referencePrice), " after you confirm.")
            : "Will close near $".concat((0, formatQuote_1.formatQuoteNumber)(g.referencePrice), " after you confirm.");
    }
    if (nextPlanned.includes('auto close off')) {
        return "Suggests standing aside near $".concat(stopS, " \u2014 full auto close is disabled.");
    }
    if (g.state === 'hold') {
        return "Will tighten logic if price stalls or drifts toward $".concat(stopS, " or $").concat(tgtS, ".");
    }
    return nextPlanned;
}
function buildExitAiCoPilotModel(input) {
    var _a, _b, _c, _d;
    var g = (_b = (_a = input.flow) === null || _a === void 0 ? void 0 : _a.effective) !== null && _b !== void 0 ? _b : null;
    var primaryStatus = computeExitAiPrimaryStatus({
        mode: input.mode,
        orderExitInFlight: input.orderExitInFlight,
        assistedPromptVisible: input.assistedPromptVisible,
        effectiveState: g === null || g === void 0 ? void 0 : g.state,
    });
    var actionPreview = buildActionPreviewLine({
        mode: input.mode,
        nextPlanned: input.nextPlanned,
        guidance: g,
        safeguards: input.safeguards,
        stop: input.stop,
        target: input.target,
    });
    var mergedContext = [(_c = input.contextLine) === null || _c === void 0 ? void 0 : _c.trim(), (_d = input.personalityExitNote) === null || _d === void 0 ? void 0 : _d.trim()].filter(Boolean).join(' — ');
    return {
        primaryStatus: primaryStatus,
        statusTitle: statusTitleFor(primaryStatus),
        directionLine: input.side === 'short' ? 'Short bias' : 'Long bias',
        intentLine: buildIntentLine(primaryStatus, input.mode, g),
        confidenceLine: buildConfidenceLine(primaryStatus, input.mode, g),
        actionPreview: actionPreview,
        contextLine: mergedContext || undefined,
        panelToneClass: panelToneFor(primaryStatus),
    };
}
/**
 * Soft bracket for AI exit (manage chart) — not a fixed take-profit line.
 */
function buildManageAiExitZoneAuxLines(args) {
    if (args.mode === 'manual')
        return undefined;
    var side = args.side, entry = args.entry, target = args.target, stop = args.stop, mark = args.mark;
    if (![entry, target, stop, mark].every(function (x) { return Number.isFinite(x) && x > 0; }))
        return undefined;
    var ref = typeof args.referencePrice === 'number' && Number.isFinite(args.referencePrice) && args.referencePrice > 0
        ? args.referencePrice
        : mark;
    var band = ref * 0.0014;
    var pad = ref * 0.00035;
    var lo = ref - band;
    var hi = ref + band;
    if (side === 'long') {
        lo = Math.max(lo, stop + pad);
        hi = Math.min(hi, target - pad);
    }
    else {
        lo = Math.max(lo, target + pad);
        hi = Math.min(hi, stop - pad);
    }
    if (!(hi > lo + ref * 0.00015))
        return undefined;
    var color = '#2dd4bf99';
    return [
        { id: 'ai-exit-zone-lo', price: lo, color: color, title: 'AI-managed zone' },
        { id: 'ai-exit-zone-hi', price: hi, color: color, title: ' ' },
    ];
}
