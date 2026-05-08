import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SigfloMobileLoader } from '@/components/layout/SigfloMobileLoader';
import { getFeedRoute } from '@/config/appRoutes';
import { SIGFLO_MOBILE_LOADER_AUTH_STATUSES } from '@/config/sigfloMobileLoaderStatuses';
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
    <SigfloMobileLoader statuses={SIGFLO_MOBILE_LOADER_AUTH_STATUSES} intervalMs={1800} />
  );
}
