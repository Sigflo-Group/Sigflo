"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExchangeConnectOnboardingSeen = isExchangeConnectOnboardingSeen;
exports.markExchangeConnectOnboardingSeen = markExchangeConnectOnboardingSeen;
var KEY_SEEN = 'sigflo_onboarding_connect_seen';
/** User finished the optional “link your exchange” step (linked, skipped, or closed the demo walkthrough). */
function isExchangeConnectOnboardingSeen() {
    try {
        return window.localStorage.getItem(KEY_SEEN) === '1';
    }
    catch (_a) {
        return true;
    }
}
function markExchangeConnectOnboardingSeen() {
    try {
        window.localStorage.setItem(KEY_SEEN, '1');
    }
    catch (_a) {
        /* ignore */
    }
}
