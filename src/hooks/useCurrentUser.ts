import { useAuth } from '@/context/AuthContext';

export function useCurrentUser() {
  const { user, loading, authMode } = useAuth();
  return { user, loading, authMode };
}
