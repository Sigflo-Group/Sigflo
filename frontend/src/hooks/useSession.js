"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSession = useSession;
var SessionProvider_1 = require("@/providers/SessionProvider");
function useSession() {
    var _a = (0, SessionProvider_1.useSessionProvider)(), securityState = _a.securityState, sessionReady = _a.sessionReady, stepUpRequired = _a.stepUpRequired, refreshSecurityState = _a.refreshSecurityState;
    return { securityState: securityState, sessionReady: sessionReady, stepUpRequired: stepUpRequired, refreshSecurityState: refreshSecurityState };
}
