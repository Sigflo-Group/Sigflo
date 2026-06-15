import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAccountSnapshot } from '@/hooks/useAccountSnapshot';
import { useBotStatuses } from '@/hooks/useBotStatuses';
import { useExchangeIntegrations } from '@/hooks/useExchangeIntegrations';
import { useFeedback } from '@/context/FeedbackContext';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { supabase } from '@/lib/supabase';
import { formatFundingBalance } from '@/lib/formatFundingBalance';
import { updateChecklist } from '@/lib/onboardingChecklist';
import { getOAuthRedirectToProfile } from '@/lib/oauthRedirectOrigin';
import {
  BYBIT_API_KEYS_HREF,
  BYBIT_DEPOSIT_HREF,
  BYBIT_SIGN_UP_HREF,
  MEXC_API_KEYS_HREF,
  MEXC_DEPOSIT_HREF,
  MEXC_SIGN_UP_HREF,
} from '@/lib/exchangeTransferUrls';
import { sanitizeUserFacingHttpErrorMessage } from '@/lib/httpErrorMessage';
import { getManualTrades } from '@/lib/tradeSourceFilter';
import { playUiTapSound } from '@/utils/sound';
import { AndroidAppSection } from '@/components/profile/AndroidAppSection';
import type { ExchangeId, ExchangeSnapshot, IntegrationStatus } from '@/types/integrations';

const MFA_TOTP_FRIENDLY_NAME = 'Sigflo Account';
const EXCHANGE_API_DOCS_HREF: Record<ExchangeId, string> = {
  bybit: 'https://bybit-exchange.github.io/docs/v5/intro',
  mexc: 'https://mexcdevelop.github.io/apidocs/spot_v3_en/',
};
const EXCHANGE_CONNECT_DRAFT_STORAGE_KEY = '__SIGFLO_PROFILE_EXCHANGE_CONNECT_DRAFT_V1__';

type RiskMode = 'Conservative' | 'Balanced' | 'Aggressive';
type ExchangeFormState = {
  exchange: ExchangeId;
  apiKey: string;
  apiSecret: string;
  passphrase: string;
};

function readExchangeConnectDraft(): ExchangeId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(EXCHANGE_CONNECT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { exchange?: unknown } | null;
    if (parsed?.exchange === 'bybit' || parsed?.exchange === 'mexc') {
      return parsed.exchange;
    }
  } catch {
    // Corrupt draft state should not block Profile rendering.
  }
  return null;
}

function persistExchangeConnectDraft(exchange: ExchangeId | null): void {
  if (typeof window === 'undefined') return;
  if (!exchange) {
    window.sessionStorage.removeItem(EXCHANGE_CONNECT_DRAFT_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(EXCHANGE_CONNECT_DRAFT_STORAGE_KEY, JSON.stringify({ exchange }));
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, authMode, signInWithGoogle, signOut } = useAuth();
  const [pushAlerts, setPushAlerts] = useState(true);
  const [highRiskAlerts, setHighRiskAlerts] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [riskMode, setRiskMode] = useState<RiskMode>('Balanced');
  const [exchangeForm, setExchangeForm] = useState<ExchangeFormState | null>(() => {
    const draftExchange = readExchangeConnectDraft();
    if (!draftExchange) return null;
    return { exchange: draftExchange, apiKey: '', apiSecret: '', passphrase: '' };
  });
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectPanelFlash, setConnectPanelFlash] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<ExchangeId | null>(null);
  const [disconnectBusy, setDisconnectBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [securityBusy, setSecurityBusy] = useState<'password' | 'sessions' | '2fa' | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [mfaStatusLoading, setMfaStatusLoading] = useState<boolean>(false);
  const [googleSignInError, setGoogleSignInError] = useState<string | null>(null);
  const connectPanelRef = useRef<HTMLElement | null>(null);
  const connectApiKeyInputRef = useRef<HTMLInputElement | null>(null);
  const connectPanelFlashTimerRef = useRef<number | null>(null);
  const [totpCopyFlash, setTotpCopyFlash] = useState(false);
  const totpCopyFlashTimerRef = useRef<number | null>(null);
  const focusConnectPanel = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.requestAnimationFrame(() => {
      connectPanelRef.current?.scrollIntoView({ behavior, block: 'center' });
      window.setTimeout(() => connectApiKeyInputRef.current?.focus(), 120);
    });
  }, []);
  const openConnectPanel = useCallback((exchange: ExchangeId) => {
    setConnectError(null);
    setExchangeForm({ exchange, apiKey: '', apiSecret: '', passphrase: '' });
  }, []);
  const closeConnectPanel = useCallback(() => {
    setExchangeForm(null);
  }, []);
  useEffect(() => {
    return () => {
      if (totpCopyFlashTimerRef.current != null) window.clearTimeout(totpCopyFlashTimerRef.current);
      if (connectPanelFlashTimerRef.current != null) window.clearTimeout(connectPanelFlashTimerRef.current);
    };
  }, []);
  useEffect(() => {
    persistExchangeConnectDraft(exchangeForm?.exchange ?? null);
  }, [exchangeForm?.exchange]);
  useEffect(() => {
    if (!exchangeForm?.exchange) return;
    setConnectPanelFlash(true);
    if (connectPanelFlashTimerRef.current != null) window.clearTimeout(connectPanelFlashTimerRef.current);
    connectPanelFlashTimerRef.current = window.setTimeout(() => {
      setConnectPanelFlash(false);
      connectPanelFlashTimerRef.current = null;
    }, 1600);
    focusConnectPanel();
  }, [exchangeForm?.exchange, focusConnectPanel]);
  const [totpSetup, setTotpSetup] = useState<{
    factorId: string;
    challengeId: string | null;
    qrCode: string | null;
    secret: string;
    otpauthUri: string | null;
    code: string;
  } | null>(null);
  const { items: integrations, loading: integrationsLoading, error: integrationsError, refresh: refreshIntegrations, connect, disconnect, setActive } = useExchangeIntegrations();
  const anyExchangeConnected = useMemo(
    () => integrations.some((i) => i.status === 'connected'),
    [integrations],
  );
  useEffect(() => {
    if (anyExchangeConnected) updateChecklist({ connectedExchange: true });
  }, [anyExchangeConnected]);
  const { open: openFeedback } = useFeedback();
  const [activateBusy, setActivateBusy] = useState<string | null>(null); // accountId being activated
  const { items: snapshots, closedTrades, loading: snapshotLoading, error: snapshotError, refresh: refreshSnapshots } =
    useAccountSnapshot({ pollMs: 12_000 });
  const {
    signals,
    connection: signalConnection,
    proIntelligenceMode,
    setProIntelligenceMode,
    advancedLayout,
    setAdvancedLayout,
  } = useSignalEngine();
  const { statusMap } = useBotStatuses();

  const displayName = user
    ? (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      'Trader'
    : authMode === 'dev'
      ? 'Local dev'
      : 'Guest';
  const displayEmail = user?.email ?? (authMode === 'dev' ? 'Using dev header (VITE_DEV_USER_ID)' : 'Sign in to sync account');
  const initials = useMemo(() => {
    const src = user?.email ?? displayName;
    const clean = src.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
    return clean.length >= 2 ? clean.toUpperCase() : 'SF';
  }, [user?.email, displayName]);

  const canUseExchangeApi = authMode === 'dev' || Boolean(user);
  const activeIntegration = integrations.find((item) => item.isActive) ?? null;
  const liveSnapshots = useMemo(() => snapshots.filter((s) => s.status === 'connected'), [snapshots]);
  const linkedIntegrations = useMemo(
    () => integrations.filter((i) => i.status === 'connected'),
    [integrations],
  );
  const headerExchange =
    activeIntegration?.exchange ?? liveSnapshots[0]?.exchange ?? linkedIntegrations[0]?.exchange ?? null;
  const headerSyncLive = headerExchange
    ? liveSnapshots.some((s) => s.exchange === headerExchange)
    : liveSnapshots.length > 0;
  const connectedExchangeLabel = headerExchange ? headerExchange.toUpperCase() : null;
  const connectedExchangeHeadline = connectedExchangeLabel
    ? headerSyncLive
      ? `Live · ${connectedExchangeLabel}`
      : `Linked · ${connectedExchangeLabel}`
    : 'No exchange connected';
  const primaryIntegration = activeIntegration ?? linkedIntegrations[0] ?? null;
  const lastSynced = primaryIntegration?.lastValidatedAt
    ? new Date(primaryIntegration.lastValidatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const manualClosedTrades = useMemo(() => getManualTrades(closedTrades), [closedTrades]);
  const signalCount = signals.length;
  const winRate = useMemo(() => {
    if (manualClosedTrades.length === 0) return '—';
    const wins = manualClosedTrades.filter((trade) => trade.closedPnl > 0).length;
    return `${Math.round((wins / manualClosedTrades.length) * 100)}%`;
  }, [manualClosedTrades]);
  const avgRr = useMemo(() => {
    if (manualClosedTrades.length === 0) return '1.9';
    const wins = manualClosedTrades.filter((trade) => trade.closedPnl > 0).map((trade) => trade.closedPnl);
    const losses = manualClosedTrades.filter((trade) => trade.closedPnl < 0).map((trade) => Math.abs(trade.closedPnl));
    if (wins.length === 0 || losses.length === 0) return '—';
    const avgWin = wins.reduce((sum, value) => sum + value, 0) / wins.length;
    const avgLoss = losses.reduce((sum, value) => sum + value, 0) / losses.length;
    return (avgWin / Math.max(avgLoss, 0.0001)).toFixed(1);
  }, [manualClosedTrades]);
  const activeBotCount = useMemo(
    () => Object.values(statusMap).filter((status) => status === 'active').length,
    [statusMap],
  );
  const totalBotCount = useMemo(() => Object.keys(statusMap).length, [statusMap]);
  const pausedBotCount = Math.max(0, totalBotCount - activeBotCount);
  const apiConnected = !integrationsError && !snapshotError;
  const dataStatus = signalConnection === 'connected' ? 'Live' : signalConnection === 'reconnecting' ? 'Syncing' : 'Offline';
  const syncIssue = integrationsError || snapshotError;
  const returnTo = useMemo(() => {
    const raw = (searchParams.get('returnTo') ?? '').trim();
    if (!raw.startsWith('/')) return null;
    if (raw.startsWith('//')) return null;
    return raw;
  }, [searchParams]);
  const riskColor = useMemo(() => {
    if (riskMode === 'Conservative') return 'text-emerald-300';
    if (riskMode === 'Aggressive') return 'text-rose-300';
    return 'text-sigflo-accent';
  }, [riskMode]);

  useEffect(() => {
    if (!disconnectTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disconnectBusy) {
        setDisconnectTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disconnectTarget, disconnectBusy]);

  useEffect(() => {
    async function loadMfaStatus() {
      if (!supabase || authMode !== 'supabase' || !user) {
        setMfaEnabled(false);
        return;
      }
      try {
        setMfaStatusLoading(true);
        const mfa = (supabase.auth as unknown as { mfa?: Record<string, unknown> }).mfa;
        const listFactors = (mfa as {
          listFactors?: () => Promise<{ data?: { all?: Array<{ status?: string }> }; error?: Error }>;
        })?.listFactors;
        if (!listFactors) {
          setMfaEnabled(false);
          return;
        }
        const { data, error } = await listFactors();
        if (error) throw error;
        const allFactors = data?.all ?? [];
        const hasVerified = allFactors.some((factor) => factor.status === 'verified');
        setMfaEnabled(hasVerified);
      } catch {
        setMfaEnabled(false);
      } finally {
        setMfaStatusLoading(false);
      }
    }
    void loadMfaStatus();
  }, [authMode, user?.id, totpSetup]);

  async function handleChangePassword() {
    if (!supabase || !user?.email) {
      setSecurityMessage('Sign in with Google to manage password resets.');
      return;
    }
    try {
      setSecurityBusy('password');
      setSecurityMessage(null);
      const redirectTo = getOAuthRedirectToProfile();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
      if (error) throw error;
      setSecurityMessage(`Password reset link sent to ${user.email}.`);
    } catch (error) {
      setSecurityMessage(error instanceof Error ? error.message : 'Failed to start password reset.');
    } finally {
      setSecurityBusy(null);
    }
  }

  async function handleManageSessions() {
    if (!supabase || !user) {
      setSecurityMessage('Sign in to manage active sessions.');
      return;
    }
    try {
      setSecurityBusy('sessions');
      setSecurityMessage(null);
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      setSecurityMessage('Signed out other sessions. Current session is still active.');
    } catch (error) {
      setSecurityMessage(error instanceof Error ? error.message : 'Failed to manage sessions.');
    } finally {
      setSecurityBusy(null);
    }
  }

  async function handleEnable2fa() {
    if (authMode !== 'supabase' || !supabase || !user) {
      setSecurityMessage('2FA setup requires Supabase sign-in.');
      return;
    }
    try {
      setSecurityBusy('2fa');
      setSecurityMessage(null);
      const mfa = supabase.auth.mfa;
      if (!mfa) {
        setSecurityMessage('MFA is not available in this auth session. Try signing out and in again.');
        return;
      }
      const { data: listed, error: listError } = await mfa.listFactors();
      if (listError) throw listError;
      const allFactors = listed?.all ?? [];
      const totpFactors = allFactors.filter((f) => f.factor_type === 'totp');
      const verifiedTotp = totpFactors.find((f) => f.status === 'verified');
      if (verifiedTotp) {
        setMfaEnabled(true);
        setSecurityMessage('2FA is already enabled on this account.');
        return;
      }
      for (const factor of totpFactors.filter((f) => f.status === 'unverified')) {
        const { error: unenrollError } = await mfa.unenroll({ factorId: factor.id });
        if (unenrollError) throw unenrollError;
      }
      const { data, error } = await mfa.enroll({ factorType: 'totp', friendlyName: MFA_TOTP_FRIENDLY_NAME });
      if (error) throw error;
      const factorId = data?.id as string | undefined;
      const qrCode = (data?.totp?.qr_code as string | undefined)?.trim() || null;
      const secret = (data?.totp?.secret as string | undefined)?.trim() || '';
      const otpauthUri = (data?.totp?.uri as string | undefined)?.trim() || null;
      if (!factorId || !secret) {
        setSecurityMessage('Could not initialize TOTP setup. Try again.');
        return;
      }
      setTotpSetup({
        factorId,
        challengeId: null,
        qrCode,
        secret,
        otpauthUri,
        code: '',
      });
      setSecurityMessage(
        'Scan the QR if you can, or enter the setup key / open the setup link, then enter the 6-digit code.',
      );
    } catch (error) {
      setSecurityMessage(error instanceof Error ? `2FA setup failed: ${error.message}` : '2FA setup failed. Please try again.');
    } finally {
      setSecurityBusy(null);
    }
  }

  async function handleVerifyTotp() {
    if (!supabase || !totpSetup) return;
    if (!/^\d{6}$/.test(totpSetup.code.trim())) {
      setSecurityMessage('Enter a valid 6-digit authenticator code.');
      return;
    }
    try {
      setSecurityBusy('2fa');
      setSecurityMessage(null);
      const mfa = (supabase.auth as unknown as { mfa?: Record<string, unknown> }).mfa;
      const challenge = (mfa as {
        challenge?: (args: { factorId: string }) => Promise<{ data?: { id?: string }; error?: Error }>;
      })?.challenge;
      const verify = (mfa as {
        verify?: (args: { factorId: string; challengeId: string; code: string }) => Promise<{ data?: unknown; error?: Error }>;
      })?.verify;
      if (!challenge || !verify) {
        setSecurityMessage('This Supabase SDK version does not support MFA verification APIs.');
        return;
      }
      let challengeId = totpSetup.challengeId;
      if (!challengeId) {
        const challengeRes = await challenge({ factorId: totpSetup.factorId });
        if (challengeRes.error) throw challengeRes.error;
        challengeId = (challengeRes.data?.id as string | undefined) ?? null;
        if (!challengeId) {
          setSecurityMessage('Unable to create verification challenge. Please try again.');
          return;
        }
      }
      const verifyRes = await verify({
        factorId: totpSetup.factorId,
        challengeId,
        code: totpSetup.code.trim(),
      });
      if (verifyRes.error) throw verifyRes.error;
      setMfaEnabled(true);
      setTotpCopyFlash(false);
      setSecurityMessage('2FA enabled successfully.');
      setTotpSetup(null);
    } catch (error) {
      setSecurityMessage(error instanceof Error ? error.message : 'Failed to verify 2FA code.');
    } finally {
      setSecurityBusy(null);
    }
  }

  async function handleCancelTotpSetup() {
    setTotpCopyFlash(false);
    if (!supabase || !totpSetup) {
      setTotpSetup(null);
      return;
    }
    try {
      const mfa = (supabase.auth as unknown as { mfa?: Record<string, unknown> }).mfa;
      const unenroll = (mfa as { unenroll?: (args: { factorId: string }) => Promise<{ error?: Error }> })?.unenroll;
      if (unenroll) {
        const { error } = await unenroll({ factorId: totpSetup.factorId });
        if (error) throw error;
      }
    } catch {
      // best-effort cleanup; factor remains unverified if unenroll is unavailable
    } finally {
      setTotpSetup(null);
    }
  }

  async function handleManualSync() {
    setSyncBusy(true);
    try {
      await refreshIntegrations();
      await refreshSnapshots();
    } catch {
      // Individual hooks surface their own errors via integrationsError / snapshotError.
      // Swallow here so syncBusy always resets.
    } finally {
      setSyncBusy(false);
    }
  }

  return (
    <div
      className="space-y-3.5 pb-6 pt-4"
      onClickCapture={(event) => {
        const target = event.target as HTMLElement | null;
        const btn = target?.closest('button');
        if (!btn || btn.hasAttribute('disabled')) return;
        playUiTapSound();
      }}
    >
      <div className="px-1">
        <h2 className="text-lg font-semibold tracking-tight text-white">Account</h2>
        {returnTo ? (
          <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="mt-2 rounded-lg border border-[#00ffc8]/28 bg-[#00ffc8]/10 px-2.5 py-1 text-[11px] font-semibold text-[#bafef1] transition hover:bg-[#00ffc8]/14"
          >
            Back to previous screen
          </button>
        ) : null}
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-4 shadow-[0_0_28px_-20px_rgba(0,255,200,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/[0.14] text-sm font-bold text-cyan-200">
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">{displayName}</p>
              <p className="text-xs text-sigflo-muted">{displayEmail}</p>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
              Pro
            </span>
            <p className="text-[11px] font-semibold text-sigflo-accent">
              {connectedExchangeHeadline}
            </p>
            {lastSynced ? <p className="text-[10px] text-sigflo-muted">Last synced: {lastSynced}</p> : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {authMode === 'supabase' && !authLoading && !user ? (
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => {
                  setGoogleSignInError(null);
                  void signInWithGoogle().catch((e: unknown) => {
                    setGoogleSignInError(e instanceof Error ? e.message : 'Google sign-in failed');
                  });
                }}
                className="rounded-lg border border-white/[0.1] bg-sigflo-elevated px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1c1d26]"
              >
                Continue with Google
              </button>
              {googleSignInError ? (
                <p className="max-w-[14rem] text-right text-[10px] leading-snug text-rose-300/95">{googleSignInError}</p>
              ) : null}
            </div>
          ) : null}
          {authMode === 'supabase' && user ? (
            <>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    await signOut();
                    navigate('/login', { replace: true });
                  })();
                }}
                className="rounded-lg border border-white/[0.08] bg-sigflo-elevated px-3 py-1.5 text-xs font-semibold text-sigflo-muted transition hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : null}
          {authMode === 'dev' ? (
            <p className="text-[11px] text-sigflo-muted">Auth: dev header (set VITE_SUPABASE_* for Google sign-in).</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Exchange Connections</p>
        {authMode === 'supabase' && !user && !authLoading ? (
          <p className="mt-2 text-[11px] text-amber-200/90">Sign in with Google to connect Bybit or MEXC.</p>
        ) : null}
        <div className="mt-2 space-y-2">
          {(['bybit', 'mexc'] as ExchangeId[]).map((exchange) => {
            const integration = integrations.find((i) => i.exchange === exchange);
            const snapshot = snapshots.find((s) => s.exchange === exchange);
            const linked = Boolean(integration);
            const isActive = integration?.isActive ?? false;
            const connection = describeExchangeConnection(integration, snapshot);
            return (
              <div
                key={exchange}
                className={`rounded-xl border p-2.5 transition ${
                  isActive
                    ? 'border-sigflo-accent/30 bg-[#101916] shadow-[0_0_26px_-16px_rgba(0,255,200,0.45)]'
                    : linked
                      ? 'border-white/[0.12] bg-sigflo-elevated'
                      : 'border-white/[0.06] bg-sigflo-elevated'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold uppercase text-white">{exchange}</p>
                      {isActive && (
                        <span className="rounded-full bg-sigflo-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sigflo-accent">
                          Active
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] font-medium ${connection.labelClass}`}>
                      {connection.label}
                    </p>
                    <p className="text-[11px] text-sigflo-muted">{connection.sublabel}</p>
                  </div>
                  {linked ? (
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {!isActive && integration && (
                        <button
                          type="button"
                          disabled={activateBusy === integration.id}
                          onClick={async () => {
                            if (!integration) return;
                            setActivateBusy(integration.id);
                            try {
                              await setActive(integration.id);
                              await refreshSnapshots();
                            } catch (e) {
                              setConnectError(e instanceof Error ? e.message : 'Failed to switch exchange.');
                            } finally {
                              setActivateBusy(null);
                            }
                          }}
                          className="rounded-lg border border-sigflo-accent/30 bg-sigflo-accent/10 px-2 py-1 text-[11px] font-semibold text-sigflo-accent transition hover:bg-sigflo-accent/15 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {activateBusy === integration.id ? 'Switching...' : 'Set Active'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          openConnectPanel(exchange);
                        }}
                        className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]"
                      >
                        Reconnect
                      </button>
                      <a
                        href={exchange === 'bybit' ? BYBIT_DEPOSIT_HREF : MEXC_DEPOSIT_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${exchange.toUpperCase()} deposit in a new tab`}
                        className="rounded-lg border border-sigflo-accent/35 bg-sigflo-accent/10 px-2 py-1 text-[11px] font-semibold text-sigflo-accent transition hover:bg-sigflo-accent/15"
                      >
                        Deposit
                      </a>
                      <button
                        type="button"
                        onClick={() => setDisconnectTarget(exchange)}
                        className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/15"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <a
                        href={exchange === 'bybit' ? BYBIT_SIGN_UP_HREF : MEXC_SIGN_UP_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Create a new ${exchange.toUpperCase()} account in a new tab`}
                        className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                      >
                        Create account
                      </a>
                      <a
                        href={exchange === 'bybit' ? BYBIT_API_KEYS_HREF : MEXC_API_KEYS_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${exchange.toUpperCase()} API key settings in a new tab`}
                        className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]"
                      >
                        API Keys
                      </a>
                      <a
                        href={EXCHANGE_API_DOCS_HREF[exchange]}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${exchange.toUpperCase()} API documentation in a new tab`}
                        className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]"
                      >
                        API Docs
                      </a>
                      <button
                        type="button"
                        disabled={!canUseExchangeApi}
                        onClick={() => {
                          openConnectPanel(exchange);
                        }}
                        className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Connect
                      </button>
                    </div>
                  )}
                </div>
                {snapshot ? <ExchangeBalanceBreakdown snapshot={snapshot} /> : null}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          {integrationsLoading || snapshotLoading ? (
            <p className="text-[11px] text-sigflo-muted">
              {integrationsLoading && snapshotLoading
                ? 'Syncing exchange list and balances…'
                : integrationsLoading
                  ? 'Loading exchange connections…'
                  : 'Syncing portfolio balances…'}
            </p>
          ) : (
            <p className="text-[11px] text-sigflo-muted">Need a refresh? Sync manually.</p>
          )}
          <button
            type="button"
            disabled={syncBusy}
            onClick={() => void handleManualSync()}
            className="shrink-0 rounded-lg border border-white/[0.12] bg-sigflo-elevated px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-text transition hover:bg-[#1c1d26] disabled:opacity-50"
          >
            {syncBusy ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
        {syncIssue ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-2.5 py-2">
            <p className="text-[11px] text-amber-100">
              Last sync failed: {sanitizeUserFacingHttpErrorMessage(syncIssue)}
            </p>
            <button
              type="button"
              disabled={syncBusy}
              onClick={() => void handleManualSync()}
              className="shrink-0 rounded-lg border border-amber-200/35 bg-amber-200/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-200/15 disabled:opacity-50"
            >
              {syncBusy ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        ) : null}
        {connectError ? (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-[11px] text-rose-300">{connectError}</p>
          </div>
        ) : null}
        {exchangeForm ? (
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-cyan-400/25 bg-cyan-500/[0.08] px-2.5 py-2">
            <p className="text-[11px] text-cyan-100/90">
              Connection panel for {exchangeForm.exchange.toUpperCase()} is open below.
            </p>
            <button
              type="button"
              onClick={() => focusConnectPanel()}
              className="shrink-0 rounded-lg border border-cyan-300/45 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Jump to panel
            </button>
          </div>
        ) : null}
      </section>

      {exchangeForm ? (
        <section
          ref={connectPanelRef}
          className={`rounded-2xl border bg-cyan-500/[0.06] p-3.5 transition-all ${
            connectPanelFlash
              ? 'border-cyan-300/65 ring-2 ring-cyan-300/35 shadow-[0_0_0_2px_rgba(34,211,238,0.2),0_0_32px_-14px_rgba(34,211,238,0.8)]'
              : 'border-cyan-400/25'
          }`}
        >
          <p className="text-sm font-semibold text-cyan-100">Connect {exchangeForm.exchange.toUpperCase()}</p>
          <p className="mt-1 text-[11px] text-cyan-100/85">Connection panel opened below. Paste keys to continue.</p>
          <div className="mt-2 space-y-2">
            <input
              ref={connectApiKeyInputRef}
              value={exchangeForm.apiKey}
              onChange={(e) => setExchangeForm({ ...exchangeForm, apiKey: e.target.value })}
              placeholder="API key"
              className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2 text-sm text-white outline-none"
            />
            <input
              value={exchangeForm.apiSecret}
              onChange={(e) => setExchangeForm({ ...exchangeForm, apiSecret: e.target.value })}
              placeholder="API secret"
              className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2 text-sm text-white outline-none"
            />
            <input
              value={exchangeForm.passphrase}
              onChange={(e) => setExchangeForm({ ...exchangeForm, passphrase: e.target.value })}
              placeholder="Passphrase (optional)"
              className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2 text-sm text-white outline-none"
            />
          </div>
          <p className="mt-2 text-[11px] text-sigflo-muted">
            Need permissions help?{' '}
            <a
              href={EXCHANGE_API_DOCS_HREF[exchangeForm.exchange]}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sigflo-accent underline decoration-sigflo-accent/40 underline-offset-2 transition hover:decoration-sigflo-accent"
            >
              Open API docs
            </a>{' '}
            or{' '}
            <a
              href={exchangeForm.exchange === 'bybit' ? BYBIT_API_KEYS_HREF : MEXC_API_KEYS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sigflo-accent underline decoration-sigflo-accent/40 underline-offset-2 transition hover:decoration-sigflo-accent"
            >
              API key settings
            </a>
            .
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={connectBusy}
              onClick={async () => {
                if (!exchangeForm.apiKey || !exchangeForm.apiSecret) {
                  setConnectError('API key and secret are required.');
                  return;
                }
                try {
                  setConnectBusy(true);
                  setConnectError(null);
                  await connect(exchangeForm.exchange, {
                    apiKey: exchangeForm.apiKey,
                    apiSecret: exchangeForm.apiSecret,
                    passphrase: exchangeForm.passphrase || undefined,
                  });
                  closeConnectPanel();
                  await Promise.all([refreshIntegrations(), refreshSnapshots()]);
                } catch (e) {
                  setConnectError(
                    e instanceof Error ? sanitizeUserFacingHttpErrorMessage(e.message) : 'Connection failed.',
                  );
                } finally {
                  setConnectBusy(false);
                }
              }}
              className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200"
            >
              {connectBusy ? 'Validating...' : 'Save and validate'}
            </button>
            <button
              type="button"
              onClick={closeConnectPanel}
              className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-sigflo-text"
            >
              Cancel
            </button>
          </div>
          <p className="mt-2 text-[11px] text-sigflo-muted">Keys are encrypted at rest and never returned to the client after submission.</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Trading Profile</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {(['Conservative', 'Balanced', 'Aggressive'] as RiskMode[]).map((mode) => {
            const active = riskMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setRiskMode(mode)}
                className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                  active
                    ? 'border-cyan-400/35 bg-[#152028] text-cyan-100'
                    : 'border-white/[0.08] bg-sigflo-elevated text-sigflo-muted hover:border-white/[0.14] hover:bg-[#1c1d26] hover:text-sigflo-text'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
        <p className={`mt-2 text-xs ${riskColor}`}>Risk profile: {riskMode}</p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Intelligence Mode</p>
        <div className="mt-2 space-y-2">
          <ToggleRow
            label="Pro Intelligence Mode"
            subtext="Unlock replay internals, market condition insights, attribution analytics, and advanced diagnostics."
            value={proIntelligenceMode}
            onChange={setProIntelligenceMode}
          />
          {proIntelligenceMode ? (
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/[0.07] p-2.5">
              <p className="text-[11px] font-semibold text-cyan-100">Advanced layout density</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAdvancedLayout('compact')}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                    advancedLayout === 'compact'
                      ? 'border-cyan-300/35 bg-cyan-500/15 text-cyan-100'
                      : 'border-white/[0.1] bg-white/[0.04] text-sigflo-muted hover:text-sigflo-text'
                  }`}
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedLayout('expanded')}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                    advancedLayout === 'expanded'
                      ? 'border-cyan-300/35 bg-cyan-500/15 text-cyan-100'
                      : 'border-white/[0.1] bg-white/[0.04] text-sigflo-muted hover:text-sigflo-text'
                  }`}
                >
                  Expanded
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-sigflo-muted">
              Default mode keeps the trading experience calm and focused. Pro tools stay available when you turn this on.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Alerts</p>
        <div className="mt-2 space-y-2">
          <ToggleRow label="Push alerts" subtext="Signals & execution updates" value={pushAlerts} onChange={setPushAlerts} />
          <ToggleRow label="High-risk setup alerts" subtext="Aggressive setups only" value={highRiskAlerts} onChange={setHighRiskAlerts} />
          <ToggleRow label="Daily AI briefing" subtext="Daily market summary" value={dailyBriefing} onChange={setDailyBriefing} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Your Stats</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Signals</p>
            <p className="mt-1 text-base font-bold text-white">{signalCount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Win rate</p>
            <p className="mt-1 text-base font-bold text-emerald-300">{winRate}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Avg R:R</p>
            <p className="mt-1 text-base font-bold text-white">{avgRr}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-sigflo-muted">Based on your trading activity</p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Bot Stats</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Active</p>
            <p className="mt-1 text-base font-bold text-cyan-200">{activeBotCount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Paused</p>
            <p className="mt-1 text-base font-bold text-amber-200">{pausedBotCount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Total</p>
            <p className="mt-1 text-base font-bold text-white">{totalBotCount.toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-sigflo-muted">Based on your saved bot states</p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">System</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SystemIndicator label="API" value={apiConnected ? 'Connected' : 'Degraded'} active={apiConnected} />
          <SystemIndicator label="Data" value={dataStatus} active={signalConnection === 'connected'} />
        </div>
        <div className="mt-2">
          <Link
            to="/admin/feedback"
            className="inline-flex rounded-lg border border-cyan-400/25 bg-cyan-500/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-500/[0.14]"
          >
            Open admin feedback dashboard
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Security</p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              mfaEnabled
                ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                : 'border-white/10 bg-sigflo-elevated text-sigflo-muted'
            }`}
          >
            {mfaStatusLoading ? 'Checking 2FA...' : mfaEnabled ? '2FA enabled' : '2FA not enabled'}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          <ActionButton
            label="Change password"
            subtext="Send secure reset link to your email"
            busy={securityBusy === 'password'}
            busyLabel="Sending..."
            onClick={() => void handleChangePassword()}
          />
          <ActionButton
            label="Enable 2FA"
            subtext="Set up authenticator app (TOTP)"
            busy={securityBusy === '2fa'}
            busyLabel="Preparing..."
            onClick={() => void handleEnable2fa()}
          />
          <ActionButton
            label="Manage sessions"
            subtext="Sign out other active devices"
            busy={securityBusy === 'sessions'}
            busyLabel="Applying..."
            onClick={() => void handleManageSessions()}
          />
        </div>
        {totpSetup ? (
          <div className="mt-2 rounded-xl border border-sigflo-accent/25 bg-sigflo-accent/[0.06] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-accent">Authenticator setup</p>
            {totpSetup.qrCode ? (
              <div className="mt-2 flex justify-center rounded-lg border border-white/[0.08] bg-[#08090d] p-2">
                <iframe
                  title="TOTP QR Code"
                  srcDoc={totpSetup.qrCode}
                  sandbox=""
                  className="rounded bg-white p-2 border-0"
                  style={{ width: 200, height: 200 }}
                />
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-sigflo-muted">QR not available — use manual setup key or the link below.</p>
            )}
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Manual setup key</p>
              <p className="text-[11px] text-sigflo-muted">
                In your authenticator app, choose &quot;Enter setup key&quot; (or equivalent) and paste this secret.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={totpSetup.secret}
                  className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-sigflo-elevated px-2 py-2 font-mono text-[11px] text-white outline-none"
                  aria-label="TOTP setup secret"
                />
                <button
                  type="button"
                  disabled={securityBusy === '2fa'}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(totpSetup.secret);
                      setTotpCopyFlash(true);
                      if (totpCopyFlashTimerRef.current != null) window.clearTimeout(totpCopyFlashTimerRef.current);
                      totpCopyFlashTimerRef.current = window.setTimeout(() => {
                        setTotpCopyFlash(false);
                        totpCopyFlashTimerRef.current = null;
                      }, 2000);
                    } catch {
                      setSecurityMessage('Could not copy — select the key and copy manually.');
                    }
                  }}
                  className="shrink-0 rounded-lg border border-sigflo-accent/35 bg-sigflo-accent/10 px-2.5 py-2 text-[11px] font-semibold text-sigflo-accent transition hover:bg-sigflo-accent/15 disabled:opacity-60"
                >
                  {totpCopyFlash ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            {totpSetup.otpauthUri ? (
              <a
                href={totpSetup.otpauthUri}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-[11px] font-semibold text-sigflo-accent underline decoration-sigflo-accent/40 underline-offset-2 transition hover:decoration-sigflo-accent"
              >
                Open setup link (adds account in some apps)
              </a>
            ) : null}
            <input
              value={totpSetup.code}
              onChange={(event) => setTotpSetup((prev) => (prev ? { ...prev, code: event.target.value.replace(/\D/g, '').slice(0, 6) } : prev))}
              placeholder="Enter 6-digit code"
              inputMode="numeric"
              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-sigflo-elevated px-2.5 py-2 text-sm text-white outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={securityBusy === '2fa'}
                onClick={() => void handleCancelTotpSetup()}
                className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-sigflo-text"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={securityBusy === '2fa'}
                onClick={() => void handleVerifyTotp()}
                className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-60"
              >
                {securityBusy === '2fa' ? 'Verifying...' : 'Verify and enable'}
              </button>
            </div>
          </div>
        ) : null}
        {securityMessage ? (
          <p className="mt-2 rounded-lg border border-white/[0.08] bg-sigflo-elevated px-2.5 py-2 text-[11px] text-sigflo-text">{securityMessage}</p>
        ) : null}
      </section>

      {disconnectTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!disconnectBusy) setDisconnectTarget(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-rose-400/25 bg-[#0B0B0B] p-4 shadow-[0_0_40px_-18px_rgba(255,91,123,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold text-rose-100">Disconnect {disconnectTarget.toUpperCase()}?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-100/85">
              This will stop syncing balances and positions until you connect this exchange again.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={disconnectBusy}
                onClick={() => setDisconnectTarget(null)}
                className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-sigflo-text transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disconnectBusy}
                onClick={async () => {
                  if (!disconnectTarget) return;
                  setDisconnectBusy(true);
                  try {
                    await disconnect(disconnectTarget);
                    await refreshSnapshots();
                    setDisconnectTarget(null);
                  } catch (e) {
                    setConnectError(
                      e instanceof Error ? e.message : 'Disconnect failed.',
                    );
                  } finally {
                    setDisconnectBusy(false);
                  }
                }}
                className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-50"
              >
                {disconnectBusy ? 'Disconnecting...' : 'Confirm disconnect'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Feedback ── */}
      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Feedback</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-sigflo-muted/70">
          Questions, ideas, or issues? We read everything.
        </p>
        <button
          type="button"
          onClick={openFeedback}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-sigflo-accent/20 bg-sigflo-accent/8 px-3 py-2.5 text-sm font-semibold text-sigflo-accent transition hover:border-sigflo-accent/35 hover:bg-sigflo-accent/12"
        >
          <span>Send Feedback</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      <AndroidAppSection />

      {/* ── Legal & disclosures ── */}
      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Legal</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-sigflo-muted/70">
          Sigflo provides market analysis tools, not financial advice. Trading involves real risk — you are responsible for your decisions.
        </p>
        <div className="mt-3 space-y-1.5">
          <LegalLink to="/disclosure" label="Risk disclosure" />
          <LegalLink to="/terms" label="Terms of service" />
          <LegalLink to="/privacy" label="Privacy policy" />
        </div>
      </section>
    </div>
  );
}

function LegalLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-sigflo-elevated px-3 py-2 text-sm text-sigflo-text transition hover:border-white/[0.12] hover:bg-[#1c1d26]"
    >
      <span>{label}</span>
      <span className="text-sigflo-muted">→</span>
    </Link>
  );
}

function ToggleRow({
  label,
  subtext,
  value,
  onChange,
}: {
  label: string;
  subtext: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-sigflo-elevated px-3 py-2 text-left transition hover:border-white/[0.12] hover:bg-[#1c1d26]"
    >
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-sigflo-muted">{subtext}</p>
      </div>
      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
          value ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/[0.04] text-sigflo-muted'
        }`}
      >
        {value ? 'On' : 'Off'}
      </span>
    </button>
  );
}

function formatExchangeLastSynced(lastValidatedAt: string | null | undefined): string {
  if (!lastValidatedAt) return 'just now';
  return new Date(lastValidatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function describeExchangeConnection(
  integration: IntegrationStatus | undefined,
  snapshot: ExchangeSnapshot | undefined,
): { label: string; sublabel: string; labelClass: string } {
  const linked = Boolean(integration);
  const syncLive = snapshot?.status === 'connected';
  const syncError = snapshot?.status === 'error';
  const isActive = integration?.isActive ?? false;
  const isInvalid = integration?.status === 'invalid';

  if (!linked) {
    return {
      label: syncLive ? 'Live (not linked here)' : 'Not connected',
      sublabel: syncLive
        ? 'Portfolio data is syncing, but this exchange is not stored in your account — use Connect if you expect it here.'
        : 'Link API keys — withdrawals must be off',
      labelClass: 'text-sigflo-muted',
    };
  }
  if (isInvalid) {
    return {
      label: 'Invalid API keys',
      sublabel: 'Reconnect with valid read-only keys',
      labelClass: 'text-rose-300',
    };
  }
  if (syncError) {
    return {
      label: isActive ? 'Active · sync failed' : 'Linked · sync failed',
      sublabel:
        snapshot?.syncError?.trim() != null && snapshot.syncError.trim() !== ''
          ? sanitizeUserFacingHttpErrorMessage(snapshot.syncError.trim())
          : 'Portfolio sync failed — try Sync now',
      labelClass: 'text-rose-300',
    };
  }
  if (syncLive && isActive) {
    return {
      label: 'Active · live',
      sublabel: `Last synced: ${formatExchangeLastSynced(integration?.lastValidatedAt)}`,
      labelClass: 'text-emerald-300',
    };
  }
  if (syncLive) {
    return {
      label: 'Connected · live',
      sublabel: `Last synced: ${formatExchangeLastSynced(integration?.lastValidatedAt)} · use Set Active to trade here`,
      labelClass: 'text-cyan-300/70',
    };
  }
  return {
    label: isActive ? 'Active · syncing' : 'Linked · syncing',
    sublabel: `Last synced: ${formatExchangeLastSynced(integration?.lastValidatedAt)} · waiting for portfolio data`,
    labelClass: isActive ? 'text-emerald-300' : 'text-cyan-300/70',
  };
}

function fmtUsdMaybe(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function BalanceMetricCell({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2">
      <p className="text-[9px] uppercase tracking-[0.12em] text-sigflo-muted">{label}</p>
      <p className="mt-1 text-xs font-semibold tabular-nums text-white">{fmtUsdMaybe(value)}</p>
    </div>
  );
}

function ExchangeBalanceBreakdown({ snapshot }: { snapshot: ExchangeSnapshot }) {
  const breakdown = snapshot.accountBreakdown ?? null;

  if (!breakdown) {
    if (snapshot.status === 'error') {
      const detailRaw = snapshot.syncError?.trim();
      const detail = detailRaw ? sanitizeUserFacingHttpErrorMessage(detailRaw) : '';
      return (
        <div className="mt-2 space-y-1.5 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2 py-2 text-[11px] leading-snug text-rose-100/95">
          <p>
            Portfolio sync failed for this exchange. Try Sync now, or disconnect and reconnect after checking API key
            permissions.
          </p>
          {detail ? (
            <p className="font-mono text-[10px] text-rose-50/95 [overflow-wrap:anywhere]">{detail}</p>
          ) : null}
          {detail && /\b403\b|HTTP 403/i.test(detail) ? (
            <p className="text-[10px] text-sigflo-muted">
              If your Bybit key uses an IP allowlist, add your backend&apos;s outbound IP (e.g. Railway) or use &quot;No
              IP restriction&quot; while debugging.
            </p>
          ) : null}
        </div>
      );
    }
    const noRows = snapshot.balances.length === 0 && snapshot.positions.length === 0;
    if (noRows) {
      return (
        <div className="mt-2 space-y-2">
          <p className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-2.5 py-2 text-[11px] leading-snug text-amber-100/95">
            Connected, but{' '}
            <span className="font-semibold">no balance data</span>
            {' '}came back. Check that the API key has read access and is not IP-restricted. Disconnect and reconnect if the issue persists.
          </p>
        </div>
      );
    }
    const STABLE_ASSETS = new Set(['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDE']);
    const stableFree = snapshot.balances
      .filter((b) => STABLE_ASSETS.has(b.asset.toUpperCase()))
      .reduce((sum, b) => sum + b.free, 0);
    const stableTotal = snapshot.balances
      .filter((b) => STABLE_ASSETS.has(b.asset.toUpperCase()))
      .reduce((sum, b) => sum + b.total, 0);
    const nonStableBalances = snapshot.balances
      .filter((b) => !STABLE_ASSETS.has(b.asset.toUpperCase()) && b.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    return (
      <div className="mt-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <BalanceMetricCell label="Available (USDT)" value={stableFree > 0 ? stableFree : null} />
          <BalanceMetricCell label="Total Stable" value={stableTotal > 0 ? stableTotal : null} />
        </div>
        {nonStableBalances.length > 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2">
            <p className="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-sigflo-muted">Other assets</p>
            <div className="space-y-1">
              {nonStableBalances.map((b) => (
                <div key={b.asset} className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-white/80">{b.asset}</span>
                  <span className="text-[10px] tabular-nums text-white/60">
                    {b.total.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {snapshot.positions.length > 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated px-2 py-1.5">
            <p className="text-[10px] text-sigflo-muted">
              {snapshot.positions.length} open {snapshot.positions.length === 1 ? 'position' : 'positions'}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2.5">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <BalanceMetricCell label="Total Equity" value={breakdown.overview.totalEquity} />
        <BalanceMetricCell label="Wallet Balance" value={breakdown.overview.totalWalletBalance} />
        <BalanceMetricCell label="Available to Trade" value={breakdown.overview.availableToTrade} />
        <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2">
          <p className="text-[9px] uppercase tracking-[0.12em] text-sigflo-muted">Funding Balance</p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-white">
            {formatFundingBalance(
              breakdown.overview.fundingWalletBalance ?? NaN,
              breakdown.overview.fundingPrimaryAsset,
            )}
          </p>
          <p className="mt-0.5 text-[8px] leading-tight text-sigflo-muted/85" title="Funding = deposit / transfer wallet">
            Funding = deposit / transfer wallet
          </p>
        </div>
      </div>

      {breakdown.buckets.map((bucket) => {
        const usdt = bucket.assets.find((a) => a.asset === 'USDT');
        return (
          <div key={bucket.kind} className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/95">{bucket.label}</p>
                <p className="mt-0.5 text-[10px] text-sigflo-muted">{bucket.helperText}</p>
              </div>
              {usdt ? (
                <span className="rounded border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100/95">
                  USDT {fmtUsdMaybe(usdt.total)}
                </span>
              ) : null}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <BalanceMetricCell label="Available Balance" value={bucket.metrics.availableBalance} />
              <BalanceMetricCell label="Wallet Balance" value={bucket.metrics.walletBalance} />
              <BalanceMetricCell label="Equity" value={bucket.metrics.equity} />
              <BalanceMetricCell label="Margin Balance" value={bucket.metrics.marginBalance} />
              <BalanceMetricCell label="Margin Used" value={bucket.metrics.marginUsed} />
              <BalanceMetricCell label="Unrealized PnL" value={bucket.metrics.unrealizedPnl} />
            </div>
            {bucket.kind === 'funding' && bucket.assets.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bucket.assets.slice(0, 8).map((a) => (
                  <span
                    key={a.asset}
                    className="rounded border border-white/[0.08] bg-[#08090d] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-sigflo-text/95"
                    title={`${a.asset} — wallet total`}
                  >
                    {a.asset}{' '}
                    <span className="text-white/90">{fmtUsdMaybe(a.total)}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SystemIndicator({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">{label}</p>
      <p className={`mt-1 text-xs font-semibold ${active ? 'text-emerald-300' : 'text-sigflo-text'}`}>{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  subtext,
  onClick,
  busy,
  busyLabel,
}: {
  label: string;
  subtext: string;
  onClick: () => void;
  busy?: boolean;
  busyLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full rounded-lg border border-white/[0.08] bg-sigflo-elevated px-3 py-2 text-left text-sm text-sigflo-text transition hover:border-white/[0.14] hover:bg-[#1c1d26] disabled:opacity-60"
    >
      <p>{busy ? busyLabel ?? label : label}</p>
      <p className="mt-0.5 text-[11px] text-sigflo-muted">{subtext}</p>
    </button>
  );
}
