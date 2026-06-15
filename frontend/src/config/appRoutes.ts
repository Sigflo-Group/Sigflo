import { withAppBase } from '@/lib/appBasePath';

/**
 * Subpath deploy (e.g. `VITE_BASE=/feed/`). Treat missing/empty BASE_URL like root `/`.
 */
export function isSubpathBase(): boolean {
  const b = import.meta.env.BASE_URL;
  if (b == null || b === '' || b === '/') return false;
  return true;
}

/**
 * Product shell on `app.sigflo.group`: feed at `/`, in-SPA marketing at `/landing`.
 * Evaluated at call time so `window.location` is always correct (avoids stale module init).
 */
export function isAppSigfloProductHost(): boolean {
  if (import.meta.env.VITE_APP_HOST === 'app') return true;
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase() === 'app.sigflo.group';
}

export const APP_PRODUCT_ORIGIN = 'https://app.sigflo.group';

/** Router path for the main feed hub (call during render / handlers, not at module top level). */
export function getFeedRoute(): string {
  if (isSubpathBase()) return '/';
  if (isAppSigfloProductHost()) return '/';
  return '/feed';
}

/** Landing / marketing route when feed is not at `/`. */
export function getLandingRoute(): string {
  if (isSubpathBase()) return '/landing';
  if (isAppSigfloProductHost()) return '/landing';
  return '/';
}

export function feedBrowserPath(): string {
  return withAppBase(getFeedRoute());
}

export function openAppHref(): string {
  if (import.meta.env.PROD) return `${APP_PRODUCT_ORIGIN}/`;
  if (typeof window === 'undefined') return '/feed';
  return `${window.location.origin}${feedBrowserPath()}`;
}

export const FEED_ACTIONABLE_QUERY = '?filter=actionable';

export function feedActionablePath(): string {
  const feed = getFeedRoute();
  return feed === '/' ? `/${FEED_ACTIONABLE_QUERY}` : `${feed}${FEED_ACTIONABLE_QUERY}`;
}

export type AppRouteMeta = {
  requiresAuth: boolean;
  requiresStepUp: boolean;
  auditLabel: string;
};

export const APP_ROUTE_META: Record<string, AppRouteMeta> = {
  '/login': { requiresAuth: false, requiresStepUp: false, auditLabel: 'auth_login' },
  '/feed': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_feed' },
  '/markets': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_markets' },
  '/performance': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_performance' },
  '/analytics/strategy-attribution': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_strategy_attribution' },
  '/replay': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_trade_replay' },
  '/trade/:symbol': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_trade' },
  '/portfolio': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_portfolio' },
  '/settings/profile': { requiresAuth: true, requiresStepUp: false, auditLabel: 'settings_profile' },
  '/settings/exchange': { requiresAuth: true, requiresStepUp: false, auditLabel: 'settings_exchange' },
  '/settings/security': { requiresAuth: true, requiresStepUp: false, auditLabel: 'settings_security' },
  '/settings/execution': { requiresAuth: true, requiresStepUp: true, auditLabel: 'settings_execution' },
  '/security/step-up': { requiresAuth: true, requiresStepUp: false, auditLabel: 'security_step_up' },
};
