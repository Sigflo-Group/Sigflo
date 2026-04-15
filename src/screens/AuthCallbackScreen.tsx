import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';

/**
 * PKCE / magic-link return. Supabase client exchanges `code` on load; we then route by session.
 */
export default function AuthCallbackScreen() {
  const navigate = useNavigate();
  const { user, loading, authMode } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate(getFeedRoute(), { replace: true });
      return;
    }
    if (authMode === 'supabase') {
      navigate('/login', { replace: true });
    } else {
      navigate(getFeedRoute(), { replace: true });
    }
  }, [authMode, loading, navigate, user]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0F1115] px-6">
      <div className="h-28 w-28 rounded-full bg-[#00C878]/[0.1] blur-3xl sigflo-splash-glow-pulse" aria-hidden />
      <p className="relative -mt-16 text-sm font-medium text-[rgba(245,247,250,0.72)]">Finishing sign-in…</p>
    </div>
  );
}
