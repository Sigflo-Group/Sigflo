import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SecurityState } from '@/types/auth';
import { getCurrentSessionState } from '@/lib/api/session';
import { computeStepUpRequired } from '@/lib/sessionSecurityUi';
import { useAuthProvider } from '@/providers/AuthProvider';

type SessionProviderValue = {
  securityState: SecurityState | null;
  sessionReady: boolean;
  /** True when step-up is required or security state could not be loaded (fail-closed). */
  stepUpRequired: boolean;
  securityStateUnknown: boolean;
  refreshSecurityState: () => Promise<void>;
  applySecurityState: (state: SecurityState) => void;
};

const SessionProviderContext = createContext<SessionProviderValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthProvider();
  const [sessionReady, setSessionReady] = useState(false);
  const [securityState, setSecurityState] = useState<SecurityState | null>(null);
  const [securityStateUnknown, setSecurityStateUnknown] = useState(false);

  const applySecurityState = useCallback((state: SecurityState) => {
    setSecurityState(state);
    setSecurityStateUnknown(false);
    setSessionReady(true);
  }, []);

  const refreshSecurityState = useCallback(async () => {
    if (!user) {
      setSecurityState(null);
      setSecurityStateUnknown(false);
      setSessionReady(true);
      return;
    }
    setSessionReady(false);
    try {
      const state = await getCurrentSessionState();
      applySecurityState(state);
    } catch {
      // Fail closed: block step-up-protected routes when security state is unknown.
      setSecurityState(null);
      setSecurityStateUnknown(true);
    } finally {
      setSessionReady(true);
    }
  }, [user, applySecurityState]);

  useEffect(() => {
    void refreshSecurityState();
  }, [refreshSecurityState]);

  const value = useMemo<SessionProviderValue>(
    () => ({
      securityState,
      sessionReady,
      securityStateUnknown,
      stepUpRequired: computeStepUpRequired(securityState, securityStateUnknown),
      refreshSecurityState,
      applySecurityState,
    }),
    [securityState, sessionReady, securityStateUnknown, refreshSecurityState, applySecurityState],
  );

  return <SessionProviderContext.Provider value={value}>{children}</SessionProviderContext.Provider>;
}

export function useSessionProvider() {
  const ctx = useContext(SessionProviderContext);
  if (!ctx) throw new Error('useSessionProvider must be used within providers/SessionProvider');
  return ctx;
}
