"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryStatusFromOpportunityState = entryStatusFromOpportunityState;
exports.normalizeDetectorOutput = normalizeDetectorOutput;
function entryStatusFromOpportunityState(state) {
    switch (state) {
        case 'Triggered':
            return 'Trigger conditions met — review levels';
        case 'Ready':
            return 'Setup staged — review before any action';
        case 'Managing':
            return 'Workflow active — monitor plan vs market';
        case 'Building':
            return 'Structure building — wait for confirmation';
        case 'Watching':
            return 'Monitoring — no entry trigger yet';
        case 'CoolingOff':
            return 'Cooling off after recent activity';
        case 'Completed':
            return 'Scenario closed — archived context';
        case 'Invalidated':
            return 'Plan no longer valid at current prices';
        default:
            return 'Review context';
    }
}
function normalizeDetectorOutput(output) {
    var rationale = output.riskLabel === 'High'
        ? "".concat(output.rationale, " Higher-risk posture \u2014 wait for confirmation before acting.")
        : output.rationale;
    return {
        id: output.id,
        pair: output.pair,
        direction: output.direction,
        setupType: output.setupType,
        score: output.score,
        state: output.state,
        thesis: output.thesis,
        rationale: rationale,
        entryStatus: entryStatusFromOpportunityState(output.state),
        entryZone: output.entryZone,
        invalidation: output.invalidation,
        targets: output.targets,
        timeframeAlignment: output.timeframeAlignment,
        freshnessSec: output.freshnessSec,
    };
}
