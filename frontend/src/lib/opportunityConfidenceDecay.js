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
exports.applyOpportunityConfidenceDecay = applyOpportunityConfidenceDecay;
var opportunityNormalizer_1 = require("@/services/engine/opportunityNormalizer");
var STALE_SOFT_SEC = 120;
var STALE_HARD_SEC = 300;
/** Urgency ladder: one step down when freshness is elevated but not terminal. */
function downgradeOne(state) {
    switch (state) {
        case 'Triggered':
            return 'Ready';
        case 'Ready':
            return 'Managing';
        case 'Managing':
            return 'Building';
        case 'Building':
            return 'Watching';
        case 'Watching':
            return null;
        default:
            return null;
    }
}
function terminalStateForHardStale(state) {
    if (state === 'Completed' || state === 'Invalidated')
        return null;
    if (state === 'CoolingOff')
        return 'Invalidated';
    if (state === 'Triggered' || state === 'Ready' || state === 'Managing')
        return 'Invalidated';
    if (state === 'Building' || state === 'Watching')
        return 'CoolingOff';
    return null;
}
/**
 * Confidence decay from age (seconds since last engine touch / “as of” freshness).
 * - {@link freshnessSec} > 120: one step down the active ladder (Triggered → … → Watching).
 * - {@link freshnessSec} > 300: {@link Invalidated} for hot workflow states, else {@link CoolingOff} (then CoolingOff → Invalidated).
 */
function applyOpportunityConfidenceDecay(card) {
    var sec = card.freshnessSec;
    if (!Number.isFinite(sec) || sec <= STALE_SOFT_SEC)
        return card;
    var nextState = card.state;
    if (sec > STALE_HARD_SEC) {
        var terminal = terminalStateForHardStale(nextState);
        if (terminal)
            nextState = terminal;
    }
    else {
        var down = downgradeOne(nextState);
        if (down)
            nextState = down;
    }
    if (nextState === card.state)
        return card;
    return __assign(__assign({}, card), { state: nextState, entryStatus: (0, opportunityNormalizer_1.entryStatusFromOpportunityState)(nextState) });
}
