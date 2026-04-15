/**
 * OAuth / magic-link return URL origin. Use when apex ↔ www (or other) redirects can drop hash
 * fragments from the implicit flow — pair with `flowType: 'pkce'` on the Supabase client.
 *
 * Set `VITE_AUTH_REDIRECT_ORIGIN=https://www.sigflo.group` in **production** (e.g. Netlify) if the canonical
 * site is www. It is ignored whenever `import.meta.env.DEV` is true so local `vite` / Netlify dev always
 * returns to the tab you’re in — including Cursor Cloud, LAN IPs, or hostnames that are not `localhost`.
 */
export function getOAuthRedirectOrigin(): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  const raw = import.meta.env.VITE_AUTH_REDIRECT_ORIGIN?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      return raw.replace(/\/$/, '');
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/** Full URL for post-auth landing (e.g. profile). */
export function getOAuthRedirectToProfile(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${getOAuthRedirectOrigin()}${base}/profile`;
}

/** Magic-link / PKCE return URL — add to Supabase Auth → Redirect URLs. */
export function getMagicLinkRedirectTo(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${getOAuthRedirectOrigin()}${base}/auth/callback`;
}

/** Password recovery link target — add to Supabase Auth → Redirect URLs. */
export function getPasswordRecoveryRedirectTo(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${getOAuthRedirectOrigin()}${base}/auth/reset-password`;
}
