/** Base-coin qty string for Bybit linear `qty` (mirrors frontend `linearQtyFromBaseAmount`). */
export function linearQtyFromBaseAmount(base: number, maxDecimals = 8): string {
  if (!Number.isFinite(base) || base <= 0) return '0';
  const s = base.toFixed(maxDecimals).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}
