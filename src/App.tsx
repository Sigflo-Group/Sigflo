import { Suspense, lazy, useEffect, useState, type ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { SigfloMobileLoader } from '@/components/layout/SigfloMobileLoader';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { getFeedRoute } from '@/config/appRoutes';
import { SIGFLO_MOBILE_LOADER_FEED_STATUSES } from '@/config/sigfloMobileLoaderStatuses';
import { useAuth } from '@/context/AuthContext';
import { useAuthProvider } from '@/providers/AuthProvider';
import { isExchangeConnectOnboardingSeen } from '@/lib/exchangeConnectOnboarding';
import { SignalEngineProviderShell } from '@/components/layout/SignalEngineProviderShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StepUpProtectedRoute } from '@/components/auth/StepUpProtectedRoute';
import { useSignalEngine } from '@/hooks/useSignalEngine';

const AuthCallbackScreen = lazy(() => import('@/screens/AuthCallbackScreen'));
const ResetPasswordScreen = lazy(() => import('@/screens/ResetPasswordScreen'));
const BotDetailScreen = lazy(() => import('@/screens/BotDetailScreen'));
const BotFocusScreen = lazy(() => import('@/screens/BotFocusScreen'));
const BotSettingsScreen = lazy(() => import('@/screens/BotSettingsScreen'));
const BotsScreen = lazy(() => import('@/screens/BotsScreen'));
const RiskControlsScreen = lazy(() => import('@/screens/RiskControlsScreen'));
const EngineDetailScreen = lazy(() => import('@/screens/EngineDetailScreen'));
const EngineDebugScreen = lazy(() => import('@/screens/EngineDebugScreen').then((m) => ({ default: m.EngineDebugScreen })));
const FeedScreen = lazy(() => import('@/screens/FeedScreen').then((m) => ({ default: m.FeedScreen })));
const LoginScreen = lazy(() => import('@/screens/LoginScreen'));
const MarketsScreen = lazy(() => import('@/screens/MarketsScreen'));
const OnboardingTradingStyleScreen = lazy(() => import('@/screens/OnboardingTradingStyleScreen'));
const OnboardingConnect = lazy(() => import('@/screens/Onboarding/OnboardingConnect'));
const PortfolioScreen = lazy(() => import('@/screens/PortfolioScreen'));
const PerformanceDashboardScreen = lazy(() => import('@/screens/PerformanceDashboardScreen'));
const AdminFeedbackDashboardScreen = lazy(() => import('@/screens/AdminFeedbackDashboardScreen'));
const TradeReplayScreen = lazy(() => import('@/screens/TradeReplayScreen'));
const PrivacyPolicyScreen = lazy(() => import('@/screens/PrivacyPolicyScreen'));
const LegalScreen = lazy(() => import('@/screens/LegalScreen'));
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'));
const ScannerLabScreen = lazy(() => import('@/screens/ScannerLabScreen').then((m) => ({ default: m.ScannerLabScreen })));
const TradeScreen = lazy(() => import('@/screens/TradeScreen').then((m) => ({ default: m.TradeScreen })));
const StepUpVerificationScreen = lazy(() => import('@/screens/StepUpVerificationScreen'));

function ProtectedLayout() {
  const { user, loading, authMode } = useAuth();
  if (loading) return null;
  if (authMode !== 'supabase') return <Outlet />;
  const needLogin = !user;
  if (needLogin) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function OnboardingGate() {
  const { user, authMode } = useAuth();
  const location = useLocation();
  if (authMode !== 'supabase' || !user) return <Outlet />;
  const connectSeen = isExchangeConnectOnboardingSeen();
  const onOnboarding = location.pathname === '/onboarding' || location.pathname === '/onboarding/connect';
  if (connectSeen && onOnboarding) {
    return <Navigate to={getFeedRoute()} replace />;
  }
  if (!connectSeen && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

function ProIntelligenceRoute({ children }: { children: ReactElement }) {
  const { proIntelligenceMode } = useSignalEngine();
  if (!proIntelligenceMode) return <Navigate to="/performance" replace />;
  return children;
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

  // Normalise path: strip trailing slash so /legal/ and /legal both match.
  const normPath = location.pathname.replace(/\/$/, '') || '/';
  const SPLASH_SKIP_PATHS = new Set(['/disclosure', '/terms', '/privacy', '/legal']);
  const skipSplash = isAuthFastEntryPath(normPath) || SPLASH_SKIP_PATHS.has(normPath);
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
        <Suspense fallback={<SplashScreen />}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/disclosure" element={<Navigate to="/legal" replace />} />
          <Route path="/terms" element={<LegalScreen />} />
          <Route path="/privacy" element={<PrivacyPolicyScreen />} />
          <Route path="/legal" element={<LegalScreen />} />
          <Route path="/auth/callback" element={<AuthCallbackScreen />} />
          <Route path="/auth/reset-password" element={<ResetPasswordScreen />} />
          <Route element={<ProtectedLayout />}>
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
                  <Route path="/performance" element={<ProtectedRoute><PerformanceDashboardScreen /></ProtectedRoute>} />
                  <Route path="/admin/feedback" element={<ProtectedRoute><AdminFeedbackDashboardScreen /></ProtectedRoute>} />
                  <Route
                    path="/replay"
                    element={
                      <ProtectedRoute>
                        <ProIntelligenceRoute>
                          <TradeReplayScreen />
                        </ProIntelligenceRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
                  <Route path="/settings/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
                  <Route path="/settings/exchange" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
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
          <Route path="*" element={<Navigate to={feedRoute} replace />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
