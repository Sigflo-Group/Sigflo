"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeAuthError = describeAuthError;
/** Map Supabase auth errors to short, user-facing copy. */
function describeAuthError(err, fallback) {
    if (fallback === void 0) { fallback = 'Something went wrong. Try again.'; }
    if (err && typeof err === 'object' && 'message' in err) {
        var raw = String(err.message).trim();
        if (!raw)
            return fallback;
        var lower = raw.toLowerCase();
        if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
            return 'Invalid email or password.';
        }
        if (lower.includes('already registered') ||
            lower.includes('user already registered') ||
            lower.includes('email address is already registered')) {
            return 'This email is already registered. Sign in instead, or use magic link.';
        }
        if (lower.includes('password') && (lower.includes('weak') || lower.includes('short') || lower.includes('least'))) {
            return 'Password is too weak. Use at least 6 characters, or a stronger mix of characters.';
        }
        if (lower.includes('email not confirmed') || lower.includes('confirm your email')) {
            return 'Confirm your email first — check your inbox for the verification link.';
        }
        if (lower.includes('session missing') || lower.includes('auth session missing')) {
            return 'No active reset session. Open the link from your latest reset email in this browser, or request a new reset from the login screen (use the same site URL and port as when you sent the reset).';
        }
        if (lower.includes('code verifier') || lower.includes('code_verifier')) {
            return 'This reset link must be opened in the same browser where you requested it. Request a new reset from the login screen and open the link there.';
        }
        if (lower.includes('rate limit') || lower.includes('too many')) {
            return 'Too many attempts. Wait a moment and try again.';
        }
        if (lower.includes('email') && lower.includes('invalid')) {
            return 'Enter a valid email address.';
        }
        return raw;
    }
    return fallback;
}
