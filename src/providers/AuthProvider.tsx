import { useMemo, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { requireSupabaseClient } from '@/lib/supabase/client';

type AuthProviderValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const value = useMemo<AuthProviderValue>(
    () => ({
      user: auth.user,
      session: auth.session,
      loading: auth.loading,
      signIn: auth.signInWithPassword,
      signOut: auth.signOut,
      refreshSession: async () => {
        const sb = requireSupabaseClient();
        const { error } = await sb.auth.refreshSession();
        if (error) throw error;
      },
    }),
    [auth.user, auth.session, auth.loading, auth.signInWithPassword, auth.signOut],
  );

  void value;
  return <>{children}</>;
}

export function useAuthProvider() {
  const auth = useAuth();
  return useMemo(
    () => ({
      user: auth.user,
      session: auth.session,
      loading: auth.loading,
      signIn: auth.signInWithPassword,
      signOut: auth.signOut,
      refreshSession: async () => {
        const sb = requireSupabaseClient();
        const { error } = await sb.auth.refreshSession();
        if (error) throw error;
      },
    }),
    [auth.user, auth.session, auth.loading, auth.signInWithPassword, auth.signOut],
  );
}
