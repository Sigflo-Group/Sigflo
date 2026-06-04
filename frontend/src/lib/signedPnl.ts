const DISPLAY_MINUS = '−';

function normalizeDisplayZero(value: number, fractionDigits: number): number {
  if (!Number.isFinite(value)) return 0;
  const threshold = 0.5 * 10 ** -fractionDigits;
  return Math.abs(value) < threshold ? 0 : value;
}

export function formatSignedUsd(value: number, fractionDigits = 2): string {
  const normalized = normalizeDisplayZero(value, fractionDigits);
  const sign = normalized >= 0 ? '+' : DISPLAY_MINUS;
  const amount = Math.abs(normalized).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${sign}$${amount}`;
}

export function formatSignedPercent(value: number, fractionDigits = 1): string {
  const normalized = normalizeDisplayZero(value, fractionDigits);
  const sign = normalized >= 0 ? '+' : DISPLAY_MINUS;
  return `${sign}${Math.abs(normalized).toFixed(fractionDigits)}%`;
}
