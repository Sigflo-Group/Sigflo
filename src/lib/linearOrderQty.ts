/**
 * Shrink ordered notional vs UI “position size” so exchange margin checks (IM buffer, fees, rounding)
 * are less likely to reject with errors like “ab not enough for new order”.
 * When the user is at exactly the venue minimum notional, we do not go below that floor.
 */
export const OPEN_ORDER_NOTIONAL_BUFFER_FACTOR = 0.985;

export function applyOpenOrderNotionalBuffer(
  notionalUsd: number,
  opts?: { minNotionalUsd?: number },
): number {
  if (!(notionalUsd > 0)) return 0;
  let out = notionalUsd * OPEN_ORDER_NOTIONAL_BUFFER_FACTOR;
  const minN = opts?.minNotionalUsd;
  if (minN != null && minN > 0 && notionalUsd + 1e-9 >= minN && out + 1e-9 < minN) {
    out = minN;
  }
  return out;
}

/** Base-coin qty string for Bybit linear `qty` (no scientific notation). */
export function linearQtyFromNotionalUsd(notionalUsd: number, priceUsd: number, maxDecimals = 8): string {
  if (!(notionalUsd > 0) || !(priceUsd > 0)) return '0';
  const raw = notionalUsd / priceUsd;
  const s = raw.toFixed(maxDecimals).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}

export function linearQtyFromBaseAmount(base: number, maxDecimals = 8): string {
  if (!Number.isFinite(base) || base <= 0) return '0';
  const s = base.toFixed(maxDecimals).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}

/** Quote (e.g. USDT) amount for Bybit spot market `Buy` with `marketUnit: quoteCoin`. */
export function spotQuoteQtyFromUsd(usd: number, maxDecimals = 2): string {
  if (!(usd > 0)) return '0';
  const s = usd.toFixed(maxDecimals).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}
