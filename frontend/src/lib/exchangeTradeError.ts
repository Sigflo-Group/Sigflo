import { formatBybitTradeErrorMessage } from '@/lib/bybitUserFacingError';

/** User-facing trade error — routes MEXC vs Bybit copy. */
export function formatExchangeTradeErrorMessage(
  exchange: 'bybit' | 'mexc' | null | undefined,
  err: unknown,
  fallback: string,
): string {
  if (exchange === 'mexc') {
    const msg = err instanceof Error ? err.message : String(err);
    if (/^MEXC/i.test(msg.trim())) return msg;
    return msg.trim() ? `MEXC: ${msg}` : fallback;
  }
  return formatBybitTradeErrorMessage(err, fallback);
}
