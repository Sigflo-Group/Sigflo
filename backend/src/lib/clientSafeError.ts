/**
 * Maps internal/exchange errors to client-safe messages (no key material, stack traces, or raw upstream bodies).
 */

const SAFE_MESSAGE =
  /^[\w\s.,!?():;\-/'"]{1,120}$/;

function looksSensitive(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('api key') ||
    lower.includes('apikey') ||
    lower.includes('secret') ||
    lower.includes('password') ||
    lower.includes('stack') ||
    lower.includes('retcode=') ||
    lower.includes('retmsg') ||
    (lower.includes('ip') &&
      (lower.includes('allowlist') || lower.includes('whitelist') || lower.includes('permission')))
  );
}

export function clientSafeExchangeError(error: unknown, fallback = 'Exchange request failed.'): string {
  const raw = error instanceof Error ? error.message : String(error);
  const msg = raw.trim();
  if (!msg) return fallback;

  const lower = msg.toLowerCase();
  if (lower.includes('api key') || lower.includes('apikey') || lower.includes('secret')) {
    return 'Exchange credentials were rejected. Re-link your account with valid read-only API keys.';
  }
  if (lower.includes('ip') && (lower.includes('allowlist') || lower.includes('whitelist') || lower.includes('permission'))) {
    return 'Exchange blocked this request (often IP allowlist). Add your server egress IP on the exchange key settings.';
  }
  if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('abort')) {
    return 'Exchange request timed out. Try again in a moment.';
  }
  if (lower.includes('retcode=') || lower.includes('retmsg')) {
    const retMsg = msg.match(/retMsg[=:\s]+([^—]+)/i)?.[1]?.trim();
    if (retMsg && retMsg.length <= 120 && !looksSensitive(retMsg)) return `Exchange error: ${retMsg}`;
    return 'Exchange rejected the request. Check API key permissions and account status.';
  }
  if (msg.length > 160 || looksSensitive(msg) || !SAFE_MESSAGE.test(msg)) return fallback;
  return msg;
}
