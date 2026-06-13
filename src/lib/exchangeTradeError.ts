import { formatBybitTradeErrorMessage } from '@/lib/bybitUserFacingError';

/** User-facing trade error — routes MEXC vs Bybit copy. */
export function formatExchangeTradeErrorMessage(
  exchange: 'bybit' | 'mexc' | null | undefined,
  err: unknown,
  fallback: string,
): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/step-up verification required/i.test(msg)) {
    return 'Step-up verification required for this action. Open Security → Step-up verification, enter your authenticator code, then retry.';
  }
  if (exchange === 'mexc') {
    if (/^MEXC/i.test(msg.trim())) return msg;
    return msg.trim() ? `MEXC: ${msg}` : fallback;
  }
  return formatBybitTradeErrorMessage(err, fallback);
}
