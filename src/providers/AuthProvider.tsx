import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { requireSupabaseClient } from '@/lib/supabase/client';

type AuthProviderValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthProviderContext = createContext<AuthProviderValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const sb = requireSupabaseClient();
      void sb.auth.getSession().then(({ data }) => {
        setSession(data.session ?? null);
        setLoading(false);
      });
      const {
        data: { subscription },
      } = sb.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });
      return () => subscription.unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthProviderValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn: async (email: string, password: string) => {
        const sb = requireSupabaseClient();
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },
      signOut: async () => {
        const sb = requireSupabaseClient();
        const { error } = await sb.auth.signOut();
        if (error) throw error;
      },
      refreshSession: async () => {
        const sb = requireSupabaseClient();
        const { error } = await sb.auth.refreshSession();
        if (error) throw error;
      },
    }),
    [loading, session],
  );

  return <AuthProviderContext.Provider value={value}>{children}</AuthProviderContext.Provider>;
}

export function useAuthProvider() {
  const ctx = useContext(AuthProviderContext);
  if (!ctx) throw new Error('useAuthProvider must be used within providers/AuthProvider');
  return ctx;
}
