import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { BetaAccessGate } from '@/components/layout/BetaAccessGate';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { SigfloMobileLoader } from '@/components/layout/SigfloMobileLoader';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { getFeedRoute } from '@/config/appRoutes';
import { SIGFLO_MOBILE_LOADER_FEED_STATUSES } from '@/config/sigfloMobileLoaderStatuses';
import { useAuth } from '@/context/AuthContext';
import { useAuthProvider } from '@/providers/AuthProvider';
import { isTradingStyleOnboarded } from '@/lib/tradingStyleOnboarding';
import { isExchangeConnectOnboardingSeen } from '@/lib/exchangeConnectOnboarding';
import { SignalEngineProviderShell } from '@/components/layout/SignalEngineProviderShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StepUpProtectedRoute } from '@/components/auth/StepUpProtectedRoute';

// ─── Eagerly loaded ───────────────────────────────────────────────────────────
// Keep screens that appear in the auth / splash critical path eager so there
// is no additional chunk to fetch before the user can sign in or land on feed.
import AuthCallbackScreen from '@/screens/AuthCallbackScreen';
import ResetPasswordScreen from '@/screens/ResetPasswordScreen';
import LoginScreen from '@/screens/LoginScreen';
import { FeedScreen } from '@/screens/FeedScreen';
import OnboardingTradingStyleScreen from '@/screens/OnboardingTradingStyleScreen';
import OnboardingConnect from '@/screens/Onboarding/OnboardingConnect';
import BetaAdminScreen from '@/screens/BetaAdminScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicyScreen';

// ─── Lazy loaded ─────────────────────────────────────────────────────────────
// Heavy screens (TradeScreen ≈ 5 400 lines, BotFocusScreen ≈ 1 700 lines) are
// split into their own chunks so the initial bundle stays lean.
const TradeScreen = lazy(() => import('@/screens/TradeScreen').then((m) => ({ default: m.TradeScreen })));
const BotFocusScreen = lazy(() => import('@/screens/BotFocusScreen'));
const BotDetailScreen = lazy(() => import('@/screens/BotDetailScreen'));
const BotSettingsScreen = lazy(() => import('@/screens/BotSettingsScreen'));
const BotsScreen = lazy(() => import('@/screens/BotsScreen'));
const MarketsScreen = lazy(() => import('@/screens/MarketsScreen'));
const PortfolioScreen = lazy(() => import('@/screens/PortfolioScreen'));
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'));
const RiskControlsScreen = lazy(() => import('@/screens/RiskControlsScreen'));
const EngineDetailScreen = lazy(() => import('@/screens/EngineDetailScreen'));
const StepUpVerificationScreen = lazy(() => import('@/screens/StepUpVerificationScreen'));
const EngineDebugScreen = lazy(() => import('@/screens/EngineDebugScreen').then((m) => ({ default: m.EngineDebugScreen })));
const ScannerLabScreen = lazy(() => import('@/screens/ScannerLabScreen').then((m) => ({ default: m.ScannerLabScreen })));

function ProtectedLayout() {
  const { user, loading } = useAuthProvider();
  if (loading) return null;
  const needLogin = !user;
  if (needLogin) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function OnboardingGate() {
  const { user, authMode } = useAuth();
  const location = useLocation();
  if (authMode !== 'supabase' || !user) return <Outlet />;
  const styleDone = isTradingStyleOnboarded();
  const connectSeen = isExchangeConnectOnboardingSeen();
  if (!styleDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (styleDone && !connectSeen && location.pathname !== '/onboarding/connect') {
    return <Navigate to="/onboarding/connect" replace />;
  }
  const done = styleDone && connectSeen;
  if (done && (location.pathname === '/onboarding' || location.pathname === '/onboarding/connect')) {
    return <Navigate to={getFeedRoute()} replace />;
  }
  return <Outlet />;
}

function isAuthCallbackPath(pathname: string): boolean {
  return /(^|\/)auth\/callback\/?$/.test(pathname);
}

function isAuthFastEntryPath(pathname: string): boolean {
  return isAuthCallbackPath(pathname) || /(^|\/)auth\/reset-password\/?$/.test(pathname);
}

export default function App() {
  const location = useLocation();
  const { loading: authLoading } = useAuthProvider();
  const [splashMinElapsed, setSplashMinElapsed] = useState(false);
  const [useMobileBootLoader, setUseMobileBootLoader] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const feedRoute = getFeedRoute();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setUseMobileBootLoader(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setSplashMinElapsed(true), 1050);
    return () => clearTimeout(t);
  }, []);

  const skipSplash =
    isAuthFastEntryPath(location.pathname) ||
    location.pathname === '/privacy' ||
    location.pathname === '/privacy/' ||
    location.pathname === '/admin/beta';
  const showSplash = !skipSplash && (!splashMinElapsed || authLoading);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  if (showSplash) {
    return (
      <ErrorBoundary>
        {useMobileBootLoader ? (
          <SigfloMobileLoader
            statuses={SIGFLO_MOBILE_LOADER_FEED_STATUSES}
            intervalMs={1800}
            showProgress
          />
        ) : (
          <SplashScreen />
        )}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/privacy" element={<PrivacyPolicyScreen />} />
          <Route path="/auth/callback" element={<AuthCallbackScreen />} />
          <Route path="/auth/reset-password" element={<ResetPasswordScreen />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/admin/beta" element={<BetaAdminScreen />} />
            <Route element={<BetaAccessGate />}>
              <Route path="/onboarding" element={<OnboardingTradingStyleScreen />} />
              <Route path="/onboarding/connect" element={<OnboardingConnect />} />
              <Route element={<OnboardingGate />}>
                <Route element={<SignalEngineProviderShell />}>
                  <Route element={<AppShell />}>
                    <Route path={feedRoute} element={<ProtectedRoute><FeedScreen /></ProtectedRoute>} />
                    <Route path="/markets" element={<MarketsScreen />} />
                    <Route path="/bots" element={<BotsScreen />} />
                    <Route path="/risk" element={<RiskControlsScreen />} />
                    <Route path="/engines/:engineId" element={<EngineDetailScreen />} />
                    <Route path="/bots/:botId/focus" element={<BotFocusScreen />} />
                    <Route path="/bots/:botId/settings" element={<BotSettingsScreen />} />
                    <Route path="/bots/:botId" element={<BotDetailScreen />} />
                    <Route path="/portfolio" element={<ProtectedRoute><PortfolioScreen /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
                    <Route path="/settings/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
                    <Route path="/settings/exchange" element={<StepUpProtectedRoute><ProfileScreen /></StepUpProtectedRoute>} />
                    <Route path="/settings/security" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
                    <Route path="/settings/execution" element={<StepUpProtectedRoute><ProfileScreen /></StepUpProtectedRoute>} />
                    <Route path="/security/step-up" element={<ProtectedRoute><StepUpVerificationScreen /></ProtectedRoute>} />
                    {import.meta.env.DEV ? <Route path="/engine-debug" element={<EngineDebugScreen />} /> : null}
                    {import.meta.env.DEV ? <Route path="/scanner-lab" element={<ScannerLabScreen />} /> : null}
                  </Route>
                  <Route path="/trade" element={<ProtectedRoute><TradeScreen /></ProtectedRoute>} />
                  <Route path="/trade/:symbol" element={<ProtectedRoute><TradeScreen /></ProtectedRoute>} />
                </Route>
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={feedRoute} replace />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
