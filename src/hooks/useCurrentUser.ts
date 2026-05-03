import { useAuthProvider } from '@/providers/AuthProvider';

export function useCurrentUser() {
  const { user, loading } = useAuthProvider();
  return { user, loading };
}
