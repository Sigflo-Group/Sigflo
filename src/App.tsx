import { useEffect, useState } from 'react';
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
import AuthCallbackScreen from '@/screens/AuthCallbackScreen';
import ResetPasswordScreen from '@/screens/ResetPasswordScreen';
import BotDetailScreen from '@/screens/BotDetailScreen';
import BotFocusScreen from '@/screens/BotFocusScreen';
import BotSettingsScreen from '@/screens/BotSettingsScreen';
import BotsScreen from '@/screens/BotsScreen';
import { EngineDebugScreen } from '@/screens/EngineDebugScreen';
import { FeedScreen } from '@/screens/FeedScreen';
import BetaAdminScreen from '@/screens/BetaAdminScreen';
import LoginScreen from '@/screens/LoginScreen';
import MarketsScreen from '@/screens/MarketsScreen';
import OnboardingTradingStyleScreen from '@/screens/OnboardingTradingStyleScreen';
import PortfolioScreen from '@/screens/PortfolioScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicyScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { ScannerLabScreen } from '@/screens/ScannerLabScreen';
import { TradeScreen } from '@/screens/TradeScreen';
import { SignalEngineProviderShell } from '@/components/layout/SignalEngineProviderShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StepUpProtectedRoute } from '@/components/auth/StepUpProtectedRoute';
import StepUpVerificationScreen from '@/screens/StepUpVerificationScreen';

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
  const done = isTradingStyleOnboarded();
  if (!done && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (done && location.pathname === '/onboarding') {
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
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/privacy" element={<PrivacyPolicyScreen />} />
          <Route path="/auth/callback" element={<AuthCallbackScreen />} />
          <Route path="/auth/reset-password" element={<ResetPasswordScreen />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/admin/beta" element={<BetaAdminScreen />} />
            <Route element={<BetaAccessGate />}>
              <Route path="/onboarding" element={<OnboardingTradingStyleScreen />} />
              <Route element={<OnboardingGate />}>
                <Route element={<SignalEngineProviderShell />}>
                  <Route element={<AppShell />}>
                    <Route path={feedRoute} element={<ProtectedRoute><FeedScreen /></ProtectedRoute>} />
                    <Route path="/markets" element={<MarketsScreen />} />
                    <Route path="/bots" element={<BotsScreen />} />
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
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
