"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSourceEngineFromOpportunityId = parseSourceEngineFromOpportunityId;
exports.deriveRiskLabelForReview = deriveRiskLabelForReview;
exports.buildReasoningTimelineItems = buildReasoningTimelineItems;
function parseSourceEngineFromOpportunityId(id) {
    var lower = id.trim().toLowerCase();
    if (lower.endsWith('-nova'))
        return 'Nova';
    if (lower.endsWith('-rio'))
        return 'Rio';
    if (lower.endsWith('-pulse'))
        return 'Pulse';
    if (lower.endsWith('-guard'))
        return 'Guard';
    return undefined;
}
function deriveRiskLabelForReview(opp) {
    if (/reversal/i.test(opp.setupType))
        return 'High';
    if (opp.score < 68)
        return 'High';
    if (opp.score >= 80)
        return 'Low';
    return 'Medium';
}
function buildReasoningTimelineItems(opp, hasFullContext) {
    var _a, _b;
    if (!hasFullContext || !opp) {
        return [
            'Setup context unavailable',
            'Pair loaded from route, but full engine context was not found.',
            'Awaiting user review',
        ];
    }
    return [
        'Setup detected',
        Number.isFinite(opp.score) ? "Score calculated (".concat(opp.score, ")") : 'Score calculated',
        ((_a = opp.entryZone) === null || _a === void 0 ? void 0 : _a.trim()) ? 'Entry zone mapped' : 'Entry zone pending chart confirmation',
        ((_b = opp.invalidation) === null || _b === void 0 ? void 0 : _b.trim()) ? 'Invalidation defined' : 'Invalidation pending confirmation',
        'Awaiting user review',
    ];
}
