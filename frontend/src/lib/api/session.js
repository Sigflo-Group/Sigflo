"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSessionState = getCurrentSessionState;
exports.performStepUpCheck = performStepUpCheck;
exports.revokeSession = revokeSession;
var client_1 = require("@/lib/api/client");
function getCurrentSessionState() {
    return (0, client_1.apiFetch)('/session/me');
}
function performStepUpCheck(sessionId) {
    return (0, client_1.apiFetch)('/session/step-up', {
        method: 'POST',
        body: JSON.stringify({ sessionId: sessionId }),
    });
}
function revokeSession(sessionId) {
    return (0, client_1.apiFetch)('/session/revoke', {
        method: 'POST',
        body: JSON.stringify({ sessionId: sessionId }),
    });
}
