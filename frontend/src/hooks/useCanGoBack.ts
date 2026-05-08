import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function readCanGoBack(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & { navigation?: { canGoBack?: boolean } };
  if (w.navigation && typeof w.navigation.canGoBack === 'boolean') return w.navigation.canGoBack;
  return window.history.length > 1;
}

/** True when the session history likely has a prior entry (for conditional header back → `navigate(-1)`). */
export function useCanGoBack(): boolean {
  const location = useLocation();
  return useMemo(() => readCanGoBack(), [location.key]);
}
