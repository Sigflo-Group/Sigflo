import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useCurrentUser();
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-sigflo-muted">
        Loading session...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
