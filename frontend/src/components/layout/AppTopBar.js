"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppTopBar = AppTopBar;
var SigfloLogo_1 = require("@/components/branding/SigfloLogo");
var appRoutes_1 = require("@/config/appRoutes");
var useCanGoBack_1 = require("@/hooks/useCanGoBack");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var react_router_dom_1 = require("react-router-dom");
/** Main hub screens: show shared tagline beside “Sigflo” in the top bar. */
function showAppTagline(pathname) {
    var feedPath = (0, appRoutes_1.getFeedRoute)();
    var isFeedScreen = pathname === feedPath || pathname === "".concat(feedPath, "/");
    if (isFeedScreen)
        return true;
    var p = pathname.replace(/\/$/, '') || '/';
    if (p === '/markets' || p === '/portfolio' || p === '/profile')
        return true;
    if (p === '/bots' || p.startsWith('/bots/'))
        return true;
    return false;
}
function AppTopBar() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var pathname = (0, react_router_dom_1.useLocation)().pathname;
    var canGoBack = (0, useCanGoBack_1.useCanGoBack)();
    var taglineVisible = showAppTagline(pathname);
    var p = pathname.replace(/\/$/, '') || '/';
    var showBrandingLogo = p !== '/trade';
    var _a = (0, useSignalEngine_1.useSignalEngine)(), signals = _a.signals, loading = _a.loading;
    /** Must match Feed → Actionable filter (`isFeedActionableOpportunity`), since the badge links there. */
    var actionableCount = signals.filter(marketScannerRows_1.isFeedActionableOpportunity).length;
    return (<header className="sticky top-0 z-30 -mx-4 shrink-0 border-b border-white/[0.06] bg-sigflo-bg/80 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-xl">
      <div className="flex min-h-7 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-1.5">
          {canGoBack ? (<button type="button" onClick={function () { return navigate(-1); }} className="flex h-10 min-h-[2.75rem] w-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-sigflo-muted transition hover:text-white sm:h-9 sm:min-h-0 sm:w-9 sm:min-w-0" aria-label="Back">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-[18px] w-[18px] sm:h-4 sm:w-4">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>) : null}
          <div className="flex min-w-0 items-center gap-1.5">
            {showBrandingLogo ? <SigfloLogo_1.SigfloLogo size={28} glowing className="shrink-0"/> : null}
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <h1 className="m-0 flex h-7 shrink-0 items-center text-base font-semibold leading-none tracking-tight text-white">
                Sigflo
              </h1>
              <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-[rgba(0,200,120,0.34)] bg-[rgba(0,200,120,0.12)] px-2 text-[9px] font-bold uppercase leading-none tracking-[0.12em] text-[#8FFFD4]">
                Beta
              </span>
              {taglineVisible ? (<p className="m-0 min-w-0 truncate border-l border-white/[0.1] pl-2 text-[10px] font-medium leading-none tracking-wide text-sigflo-muted">
                  From signal to execution.
                </p>) : null}
            </div>
          </div>
        </div>
        <react_router_dom_1.Link to={(0, appRoutes_1.feedActionablePath)()} className="inline-flex min-h-[2.75rem] shrink-0 items-center gap-1.5 rounded-full border border-sigflo-accent/25 bg-sigflo-accentDim px-3 py-2 text-[11px] font-bold uppercase leading-none tracking-wider text-sigflo-accent transition hover:border-sigflo-accent/40 hover:bg-sigflo-accent/14 sm:min-h-0 sm:h-7 sm:px-2.5 sm:py-0 sm:text-[10px]" aria-label="Open feed filtered to actionable setups">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-sigflo-accent [animation-duration:1.8s]"/>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sigflo-accent"/>
          </span>
          {loading
            ? 'Syncing...'
            : actionableCount === 0
                ? '0 setups'
                : actionableCount === 1
                    ? '1 setup'
                    : "".concat(actionableCount, " setups")}
        </react_router_dom_1.Link>
      </div>
    </header>);
}
