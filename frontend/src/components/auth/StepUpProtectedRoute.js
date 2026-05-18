"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepUpProtectedRoute = StepUpProtectedRoute;
var react_router_dom_1 = require("react-router-dom");
var useCurrentUser_1 = require("@/hooks/useCurrentUser");
var useSession_1 = require("@/hooks/useSession");
function StepUpProtectedRoute(_a) {
    var children = _a.children;
    var _b = (0, useCurrentUser_1.useCurrentUser)(), user = _b.user, loading = _b.loading;
    var _c = (0, useSession_1.useSession)(), sessionReady = _c.sessionReady, stepUpRequired = _c.stepUpRequired;
    var location = (0, react_router_dom_1.useLocation)();
    if (loading || !sessionReady) {
        return (<div className="flex min-h-[40vh] items-center justify-center text-sm text-sigflo-muted">
        Verifying security state...
      </div>);
    }
    if (!user)
        return <react_router_dom_1.Navigate to="/login" replace/>;
    if (stepUpRequired) {
        var redirect = encodeURIComponent("".concat(location.pathname).concat(location.search));
        return <react_router_dom_1.Navigate to={"/security/step-up?redirect=".concat(redirect)} replace/>;
    }
    return <>{children}</>;
}
exports.default = StepUpProtectedRoute;
