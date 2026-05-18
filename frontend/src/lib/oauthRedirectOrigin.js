"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthRedirectOrigin = getOAuthRedirectOrigin;
exports.getOAuthRedirectToProfile = getOAuthRedirectToProfile;
exports.getMagicLinkRedirectTo = getMagicLinkRedirectTo;
exports.getPasswordRecoveryRedirectTo = getPasswordRecoveryRedirectTo;
/**
 * OAuth / magic-link return URL origin. Use when apex ↔ www (or other) redirects can drop hash
 * fragments from the implicit flow — pair with `flowType: 'pkce'` on the Supabase client.
 *
 * Set `VITE_AUTH_REDIRECT_ORIGIN=https://www.sigflo.group` in **production** (e.g. Netlify) if the canonical
 * site is www. It is ignored whenever `import.meta.env.DEV` is true so local `vite` / Netlify dev always
 * returns to the tab you’re in — including Cursor Cloud, LAN IPs, or hostnames that are not `localhost`.
 */
function getOAuthRedirectOrigin() {
    var _a;
    if (import.meta.env.DEV && typeof window !== 'undefined') {
        return window.location.origin;
    }
    var raw = (_a = import.meta.env.VITE_AUTH_REDIRECT_ORIGIN) === null || _a === void 0 ? void 0 : _a.trim();
    if (raw) {
        try {
            return new URL(raw).origin;
        }
        catch (_b) {
            return raw.replace(/\/$/, '');
        }
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
}
/** Full URL for post-auth landing (e.g. profile). */
function getOAuthRedirectToProfile() {
    var base = import.meta.env.BASE_URL.replace(/\/$/, '');
    return "".concat(getOAuthRedirectOrigin()).concat(base, "/profile");
}
/** Magic-link / PKCE return URL — add to Supabase Auth → Redirect URLs. */
function getMagicLinkRedirectTo() {
    var base = import.meta.env.BASE_URL.replace(/\/$/, '');
    return "".concat(getOAuthRedirectOrigin()).concat(base, "/auth/callback");
}
/** Password recovery link target — add to Supabase Auth → Redirect URLs. */
function getPasswordRecoveryRedirectTo() {
    var base = import.meta.env.BASE_URL.replace(/\/$/, '');
    return "".concat(getOAuthRedirectOrigin()).concat(base, "/auth/reset-password");
}
