"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var AppShell_1 = require("@/components/layout/AppShell");
var BetaAccessGate_1 = require("@/components/layout/BetaAccessGate");
var ErrorBoundary_1 = require("@/components/layout/ErrorBoundary");
var SigfloMobileLoader_1 = require("@/components/layout/SigfloMobileLoader");
var SplashScreen_1 = require("@/components/layout/SplashScreen");
var appRoutes_1 = require("@/config/appRoutes");
var sigfloMobileLoaderStatuses_1 = require("@/config/sigfloMobileLoaderStatuses");
var AuthContext_1 = require("@/context/AuthContext");
var AuthProvider_1 = require("@/providers/AuthProvider");
var tradingStyleOnboarding_1 = require("@/lib/tradingStyleOnboarding");
var exchangeConnectOnboarding_1 = require("@/lib/exchangeConnectOnboarding");
var AuthCallbackScreen_1 = require("@/screens/AuthCallbackScreen");
var ResetPasswordScreen_1 = require("@/screens/ResetPasswordScreen");
var BotDetailScreen_1 = require("@/screens/BotDetailScreen");
var BotFocusScreen_1 = require("@/screens/BotFocusScreen");
var BotSettingsScreen_1 = require("@/screens/BotSettingsScreen");
var BotsScreen_1 = require("@/screens/BotsScreen");
var RiskControlsScreen_1 = require("@/screens/RiskControlsScreen");
var EngineDetailScreen_1 = require("@/screens/EngineDetailScreen");
var EngineDebugScreen_1 = require("@/screens/EngineDebugScreen");
var FeedScreen_1 = require("@/screens/FeedScreen");
var BetaAdminScreen_1 = require("@/screens/BetaAdminScreen");
var LoginScreen_1 = require("@/screens/LoginScreen");
var MarketsScreen_1 = require("@/screens/MarketsScreen");
var OnboardingTradingStyleScreen_1 = require("@/screens/OnboardingTradingStyleScreen");
var OnboardingConnect_1 = require("@/screens/Onboarding/OnboardingConnect");
var PortfolioScreen_1 = require("@/screens/PortfolioScreen");
var PrivacyPolicyScreen_1 = require("@/screens/PrivacyPolicyScreen");
var ProfileScreen_1 = require("@/screens/ProfileScreen");
var ScannerLabScreen_1 = require("@/screens/ScannerLabScreen");
var TradeScreen_1 = require("@/screens/TradeScreen");
var SignalEngineProviderShell_1 = require("@/components/layout/SignalEngineProviderShell");
var ProtectedRoute_1 = require("@/components/auth/ProtectedRoute");
var StepUpProtectedRoute_1 = require("@/components/auth/StepUpProtectedRoute");
var StepUpVerificationScreen_1 = require("@/screens/StepUpVerificationScreen");
function ProtectedLayout() {
    var _a = (0, AuthProvider_1.useAuthProvider)(), user = _a.user, loading = _a.loading;
    if (loading)
        return null;
    var needLogin = !user;
    if (needLogin)
        return <react_router_dom_1.Navigate to="/login" replace/>;
    return <react_router_dom_1.Outlet />;
}
function OnboardingGate() {
    var _a = (0, AuthContext_1.useAuth)(), user = _a.user, authMode = _a.authMode;
    var location = (0, react_router_dom_1.useLocation)();
    if (authMode !== 'supabase' || !user)
        return <react_router_dom_1.Outlet />;
    var styleDone = (0, tradingStyleOnboarding_1.isTradingStyleOnboarded)();
    var connectSeen = (0, exchangeConnectOnboarding_1.isExchangeConnectOnboardingSeen)();
    if (!styleDone && location.pathname !== '/onboarding') {
        return <react_router_dom_1.Navigate to="/onboarding" replace/>;
    }
    if (styleDone && !connectSeen && location.pathname !== '/onboarding/connect') {
        return <react_router_dom_1.Navigate to="/onboarding/connect" replace/>;
    }
    var done = styleDone && connectSeen;
    if (done && (location.pathname === '/onboarding' || location.pathname === '/onboarding/connect')) {
        return <react_router_dom_1.Navigate to={(0, appRoutes_1.getFeedRoute)()} replace/>;
    }
    return <react_router_dom_1.Outlet />;
}
function isAuthCallbackPath(pathname) {
    return /(^|\/)auth\/callback\/?$/.test(pathname);
}
function isAuthFastEntryPath(pathname) {
    return isAuthCallbackPath(pathname) || /(^|\/)auth\/reset-password\/?$/.test(pathname);
}
function App() {
    var location = (0, react_router_dom_1.useLocation)();
    var authLoading = (0, AuthProvider_1.useAuthProvider)().loading;
    var _a = (0, react_1.useState)(false), splashMinElapsed = _a[0], setSplashMinElapsed = _a[1];
    var _b = (0, react_1.useState)(function () { return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches; }), useMobileBootLoader = _b[0], setUseMobileBootLoader = _b[1];
    var feedRoute = (0, appRoutes_1.getFeedRoute)();
    (0, react_1.useEffect)(function () {
        var mq = window.matchMedia('(max-width: 767px)');
        var onChange = function () { return setUseMobileBootLoader(mq.matches); };
        mq.addEventListener('change', onChange);
        return function () { return mq.removeEventListener('change', onChange); };
    }, []);
    (0, react_1.useEffect)(function () {
        var t = window.setTimeout(function () { return setSplashMinElapsed(true); }, 1050);
        return function () { return clearTimeout(t); };
    }, []);
    var skipSplash = isAuthFastEntryPath(location.pathname) ||
        location.pathname === '/privacy' ||
        location.pathname === '/privacy/' ||
        location.pathname === '/admin/beta';
    var showSplash = !skipSplash && (!splashMinElapsed || authLoading);
    (0, react_1.useEffect)(function () {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname, location.search]);
    if (showSplash) {
        return (<ErrorBoundary_1.ErrorBoundary>
        {useMobileBootLoader ? (<SigfloMobileLoader_1.SigfloMobileLoader statuses={sigfloMobileLoaderStatuses_1.SIGFLO_MOBILE_LOADER_FEED_STATUSES} intervalMs={1800} showProgress/>) : (<SplashScreen_1.SplashScreen />)}
      </ErrorBoundary_1.ErrorBoundary>);
    }
    return (<ErrorBoundary_1.ErrorBoundary>
      <ErrorBoundary_1.ErrorBoundary key={location.pathname}>
        <react_router_dom_1.Routes>
          <react_router_dom_1.Route path="/login" element={<LoginScreen_1.default />}/>
          <react_router_dom_1.Route path="/privacy" element={<PrivacyPolicyScreen_1.default />}/>
          <react_router_dom_1.Route path="/auth/callback" element={<AuthCallbackScreen_1.default />}/>
          <react_router_dom_1.Route path="/auth/reset-password" element={<ResetPasswordScreen_1.default />}/>
          <react_router_dom_1.Route element={<ProtectedLayout />}>
            <react_router_dom_1.Route path="/admin/beta" element={<BetaAdminScreen_1.default />}/>
            <react_router_dom_1.Route element={<BetaAccessGate_1.BetaAccessGate />}>
              <react_router_dom_1.Route path="/onboarding" element={<OnboardingTradingStyleScreen_1.default />}/>
              <react_router_dom_1.Route path="/onboarding/connect" element={<OnboardingConnect_1.default />}/>
              <react_router_dom_1.Route element={<OnboardingGate />}>
                <react_router_dom_1.Route element={<SignalEngineProviderShell_1.SignalEngineProviderShell />}>
                  <react_router_dom_1.Route element={<AppShell_1.AppShell />}>
                    <react_router_dom_1.Route path={feedRoute} element={<ProtectedRoute_1.ProtectedRoute><FeedScreen_1.FeedScreen /></ProtectedRoute_1.ProtectedRoute>}/>
                    <react_router_dom_1.Route path="/markets" element={<MarketsScreen_1.default />}/>
                    <react_router_dom_1.Route path="/bots" element={<BotsScreen_1.default />}/>
                    <react_router_dom_1.Route path="/risk" element={<RiskControlsScreen_1.default />}/>
                    <react_router_dom_1.Route path="/engines/:engineId" element={<EngineDetailScreen_1.default />}/>
                    <react_router_dom_1.Route path="/bots/:botId/focus" element={<BotFocusScreen_1.default />}/>
                    <react_router_dom_1.Route path="/bots/:botId/settings" element={<BotSettingsScreen_1.default />}/>
                    <react_router_dom_1.Route path="/bots/:botId" element={<BotDetailScreen_1.default />}/>
                    <react_router_dom_1.Route path="/portfolio" element={<ProtectedRoute_1.ProtectedRoute><PortfolioScreen_1.default /></ProtectedRoute_1.ProtectedRoute>}/>
                    <react_router_dom_1.Route path="/profile" element={<ProtectedRoute_1.ProtectedRoute><ProfileScreen_1.default /></ProtectedRoute_1.ProtectedRoute>}/>
                    <react_router_dom_1.Route path="/settings/profile" element={<ProtectedRoute_1.ProtectedRoute><ProfileScreen_1.default /></ProtectedRoute_1.ProtectedRoute>}/>
                    <react_router_dom_1.Route path="/settings/exchange" element={<StepUpProtectedRoute_1.StepUpProtectedRoute><ProfileScreen_1.default /></StepUpProtectedRoute_1.StepUpProtectedRoute>}/>
                    <react_router_dom_1.Route path="/settings/security" element={<ProtectedRoute_1.ProtectedRoute><ProfileScreen_1.default /></ProtectedRoute_1.ProtectedRoute>}/>
                    <react_router_dom_1.Route path="/settings/execution" element={<StepUpProtectedRoute_1.StepUpProtectedRoute><ProfileScreen_1.default /></StepUpProtectedRoute_1.StepUpProtectedRoute>}/>
                    <react_router_dom_1.Route path="/security/step-up" element={<ProtectedRoute_1.ProtectedRoute><StepUpVerificationScreen_1.default /></ProtectedRoute_1.ProtectedRoute>}/>
                    {import.meta.env.DEV ? <react_router_dom_1.Route path="/engine-debug" element={<EngineDebugScreen_1.EngineDebugScreen />}/> : null}
                    {import.meta.env.DEV ? <react_router_dom_1.Route path="/scanner-lab" element={<ScannerLabScreen_1.ScannerLabScreen />}/> : null}
                  </react_router_dom_1.Route>
                  <react_router_dom_1.Route path="/trade" element={<ProtectedRoute_1.ProtectedRoute><TradeScreen_1.TradeScreen /></ProtectedRoute_1.ProtectedRoute>}/>
                  <react_router_dom_1.Route path="/trade/:symbol" element={<ProtectedRoute_1.ProtectedRoute><TradeScreen_1.TradeScreen /></ProtectedRoute_1.ProtectedRoute>}/>
                </react_router_dom_1.Route>
              </react_router_dom_1.Route>
            </react_router_dom_1.Route>
          </react_router_dom_1.Route>
          <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to={feedRoute} replace/>}/>
        </react_router_dom_1.Routes>
      </ErrorBoundary_1.ErrorBoundary>
    </ErrorBoundary_1.ErrorBoundary>);
}
