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
