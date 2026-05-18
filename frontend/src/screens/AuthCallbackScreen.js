"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthCallbackScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var SigfloMobileLoader_1 = require("@/components/layout/SigfloMobileLoader");
var appRoutes_1 = require("@/config/appRoutes");
var sigfloMobileLoaderStatuses_1 = require("@/config/sigfloMobileLoaderStatuses");
var AuthContext_1 = require("@/context/AuthContext");
/**
 * PKCE / magic-link return. Supabase client exchanges `code` on load; we then route by session.
 */
function AuthCallbackScreen() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, AuthContext_1.useAuth)(), user = _a.user, loading = _a.loading, authMode = _a.authMode;
    (0, react_1.useEffect)(function () {
        if (loading)
            return;
        if (user) {
            navigate((0, appRoutes_1.getFeedRoute)(), { replace: true });
            return;
        }
        if (authMode === 'supabase') {
            navigate('/login', { replace: true });
        }
        else {
            navigate((0, appRoutes_1.getFeedRoute)(), { replace: true });
        }
    }, [authMode, loading, navigate, user]);
    return (<SigfloMobileLoader_1.SigfloMobileLoader statuses={sigfloMobileLoaderStatuses_1.SIGFLO_MOBILE_LOADER_AUTH_STATUSES} intervalMs={1800}/>);
}
