"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectedRoute = ProtectedRoute;
var react_router_dom_1 = require("react-router-dom");
var useCurrentUser_1 = require("@/hooks/useCurrentUser");
function ProtectedRoute(_a) {
    var children = _a.children;
    var _b = (0, useCurrentUser_1.useCurrentUser)(), user = _b.user, loading = _b.loading;
    if (loading) {
        return (<div className="flex min-h-[40vh] items-center justify-center text-sm text-sigflo-muted">
        Loading session...
      </div>);
    }
    if (!user)
        return <react_router_dom_1.Navigate to="/login" replace/>;
    return <>{children}</>;
}
exports.default = ProtectedRoute;
