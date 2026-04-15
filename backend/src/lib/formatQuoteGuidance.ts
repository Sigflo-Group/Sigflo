/** Short prose price formatting (mirrors frontend `formatQuoteGuidance`). */
export function formatQuoteGuidance(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 10_000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (abs >= 1_000) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (abs >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (abs >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (abs >= 0.01) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
}
