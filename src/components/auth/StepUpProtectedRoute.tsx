import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSession } from '@/hooks/useSession';

export function StepUpProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useCurrentUser();
  const { sessionReady, stepUpRequired } = useSession();
  const location = useLocation();

  if (loading || !sessionReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-sigflo-muted">
        Verifying security state...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (stepUpRequired) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/security/step-up?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

export default StepUpProtectedRoute;
