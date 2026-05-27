export function roundUsdAmount(n: number): number {
  return Math.round(n * 100) / 100;
}

export function coerceUsdField(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
