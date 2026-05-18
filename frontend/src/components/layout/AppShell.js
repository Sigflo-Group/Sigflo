"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppShell = AppShell;
var react_router_dom_1 = require("react-router-dom");
var AppTopBar_1 = require("@/components/layout/AppTopBar");
var BottomTabNav_1 = require("@/components/layout/BottomTabNav");
var botFocusLayoutContext_1 = require("@/context/botFocusLayoutContext");
function AppShellMain() {
    var pathname = (0, react_router_dom_1.useLocation)().pathname;
    var fullChartMode = (0, botFocusLayoutContext_1.useBotFocusLayout)().fullChartMode;
    var isBotFocusCockpit = (0, botFocusLayoutContext_1.isBotFocusCockpitPath)(pathname);
    var hideTabBar = fullChartMode;
    /** Lets Bot Focus use an inner `overflow-y-auto` column (`flex-1 min-h-0`) so the cockpit scrolls on mobile. */
    var botFocusScrollChain = isBotFocusCockpit && !fullChartMode;
    /**
     * Lock shell height to the dynamic viewport so the focus cockpit’s inner scroller gets a real max height.
     * Without this, the flex column grows with content and `overflow-y-auto` never activates (broken on mobile).
     */
    var botFocusViewportLock = botFocusScrollChain;
    return (<div className={"relative flex flex-col bg-sigflo-bg ".concat(botFocusViewportLock
            ? 'h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden'
            : 'min-h-[100dvh]')}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,255,200,0.06),transparent)]" aria-hidden/>
      <main className={"relative flex-1 transition-[padding] duration-300 ease-out ".concat(hideTabBar ? 'pb-0' : 'pb-[calc(6rem+env(safe-area-inset-bottom))]', " ").concat(botFocusScrollChain ? 'flex min-h-0 flex-col overflow-hidden' : '')}>
        <div className={"mx-auto w-full px-4 transition-[max-width] duration-300 ease-out ".concat(isBotFocusCockpit ? 'max-w-lg sm:max-w-2xl lg:max-w-4xl' : 'max-w-lg', " ").concat(fullChartMode ? '!max-w-none px-0 sm:px-0 lg:max-w-none' : '', " ").concat(botFocusScrollChain ? 'flex min-h-0 min-w-0 flex-1 flex-col' : '')}>
          {!fullChartMode ? <AppTopBar_1.AppTopBar /> : null}
          <react_router_dom_1.Outlet />
        </div>
      </main>
      {hideTabBar ? null : <BottomTabNav_1.BottomTabNav />}
    </div>);
}
function AppShell() {
    return (<botFocusLayoutContext_1.BotFocusLayoutProvider>
      <AppShellMain />
    </botFocusLayoutContext_1.BotFocusLayoutProvider>);
}
