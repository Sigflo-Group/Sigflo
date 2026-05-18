"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXIT_FLOW_HOLD_SETTLE_MS = void 0;
exports.nextExitFlowForDisplay = nextExitFlowForDisplay;
/** How long raw `hold` must persist before we hide a prior trim/exit bar (reduces flicker on threshold chatter). */
exports.EXIT_FLOW_HOLD_SETTLE_MS = 900;
function nextExitFlowForDisplay(stash, rawNext, nowMs, holdSettleMs) {
    if (holdSettleMs === void 0) { holdSettleMs = exports.EXIT_FLOW_HOLD_SETTLE_MS; }
    if (!stash) {
        return { displayed: rawNext, pendingHoldUntil: null };
    }
    var nextState = rawNext.effective.state;
    if (nextState === 'trim' || nextState === 'exit') {
        return { displayed: rawNext, pendingHoldUntil: null };
    }
    var dispState = stash.displayed.effective.state;
    if (dispState === 'hold') {
        return { displayed: rawNext, pendingHoldUntil: null };
    }
    if (stash.pendingHoldUntil == null) {
        return { displayed: stash.displayed, pendingHoldUntil: nowMs + holdSettleMs };
    }
    if (nowMs < stash.pendingHoldUntil) {
        return { displayed: stash.displayed, pendingHoldUntil: stash.pendingHoldUntil };
    }
    return { displayed: rawNext, pendingHoldUntil: null };
}
