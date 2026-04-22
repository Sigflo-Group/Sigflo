import { useSessionProvider } from '@/providers/SessionProvider';

export function useSession() {
  const { securityState, sessionReady, stepUpRequired, refreshSecurityState } = useSessionProvider();
  return { securityState, sessionReady, stepUpRequired, refreshSecurityState };
}
