"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaAccessGate = BetaAccessGate;
var react_router_dom_1 = require("react-router-dom");
var useBetaAccess_1 = require("@/hooks/useBetaAccess");
var BetaWaitlistBlockedScreen_1 = require("@/screens/BetaWaitlistBlockedScreen");
var ACCENT = '#00ffc8';
/**
 * After Supabase auth, loads `profiles` and only renders the app when `approved` is true.
 * Dev / no-Supabase sessions bypass this gate.
 */
function BetaAccessGate() {
    var _a = (0, useBetaAccess_1.useBetaAccess)(), status = _a.status, approved = _a.approved, error = _a.error, refresh = _a.refresh;
    if (status === 'loading' || status === 'idle') {
        return (<div className="fixed inset-0 z-[350] flex flex-col items-center justify-center gap-3 px-6" style={{ backgroundColor: '#050505' }}>
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-transparent" style={{ borderTopColor: ACCENT }} aria-hidden/>
        <p className="text-sm font-medium text-white/55">Checking access…</p>
      </div>);
    }
    if (!approved) {
        return (<BetaWaitlistBlockedScreen_1.default errorMessage={error} onRetry={function () { return void refresh(); }}/>);
    }
    return <react_router_dom_1.Outlet />;
}
