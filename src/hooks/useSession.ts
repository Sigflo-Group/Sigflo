import { useSessionProvider } from '@/providers/SessionProvider';

export function useSession() {
  const {
    securityState,
    sessionReady,
    stepUpRequired,
    refreshSecurityState,
    applySecurityState,
  } = useSessionProvider();
  return {
    securityState,
    sessionReady,
    stepUpRequired,
    refreshSecurityState,
    applySecurityState,
  };
}
