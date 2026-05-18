"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentUser = useCurrentUser;
var AuthProvider_1 = require("@/providers/AuthProvider");
function useCurrentUser() {
    var _a = (0, AuthProvider_1.useAuthProvider)(), user = _a.user, loading = _a.loading;
    return { user: user, loading: loading };
}
