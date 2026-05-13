import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SecurityState } from '@/types/auth';
import { getCurrentSessionState } from '@/lib/api/session';
import { useAuthProvider } from '@/providers/AuthProvider';

type SessionProviderValue = {
  securityState: SecurityState | null;
  sessionReady: boolean;
  stepUpRequired: boolean;
  refreshSecurityState: () => Promise<void>;
};

const SessionProviderContext = createContext<SessionProviderValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthProvider();
  const [sessionReady, setSessionReady] = useState(false);
  const [securityState, setSecurityState] = useState<SecurityState | null>(null);

  const refreshSecurityState = useCallback(async () => {
    if (!user) {
      setSecurityState(null);
      setSessionReady(true);
      return;
    }
    setSessionReady(false);
    try {
      const state = await getCurrentSessionState();
      setSecurityState(state);
    } finally {
      setSessionReady(true);
    }
  }, [user]);

  useEffect(() => {
    void refreshSecurityState();
  }, [refreshSecurityState]);

  const value = useMemo<SessionProviderValue>(
    () => ({
      securityState,
      sessionReady,
      stepUpRequired: Boolean(securityState?.stepUp.required),
      refreshSecurityState,
    }),
    [securityState, sessionReady, refreshSecurityState],
  );

  return <SessionProviderContext.Provider value={value}>{children}</SessionProviderContext.Provider>;
}

export function useSessionProvider() {
  const ctx = useContext(SessionProviderContext);
  if (!ctx) throw new Error('useSessionProvider must be used within providers/SessionProvider');
  return ctx;
}
