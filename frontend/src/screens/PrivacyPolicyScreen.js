"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PrivacyPolicyScreen;
var react_router_dom_1 = require("react-router-dom");
var useCanGoBack_1 = require("@/hooks/useCanGoBack");
/**
 * SPA route for /privacy. Netlify serves `public/privacy/index.html` at `/privacy/index.html`
 * before the SPA fallback; this screen covers in-app navigation and `/privacy` without a file match.
 */
function PrivacyPolicyScreen() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var canGoBack = (0, useCanGoBack_1.useCanGoBack)();
    return (<div className="flex min-h-[100dvh] flex-col bg-[#0F1115]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <button type="button" onClick={function () { return (canGoBack ? navigate(-1) : navigate('/login')); }} className="text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]">
          ← Back
        </button>
        <span className="truncate text-xs font-medium text-[rgba(245,247,250,0.45)]">Privacy</span>
      </div>
      <iframe title="Privacy Policy" className="min-h-0 w-full flex-1 border-0 bg-[#050505]" src="/privacy/index.html"/>
    </div>);
}
