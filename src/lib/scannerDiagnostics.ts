import type { TimingDiagnostics } from '@/lib/timingLifecycle';

type DiagnosticEntry = TimingDiagnostics & {
  symbol: string;
  setupScore: number;
  ts: number;
};

const DIAGNOSTIC_LIMIT = 20;
const STORE_KEY = '__SIGFLO_SCANNER_DIAGNOSTICS__';

export function recordScannerDiagnostic(entry: DiagnosticEntry): void {
  const g = globalThis as Record<string, unknown>;
  const current = Array.isArray(g[STORE_KEY]) ? (g[STORE_KEY] as DiagnosticEntry[]) : [];
  const next = [...current, entry].slice(-DIAGNOSTIC_LIMIT);
  g[STORE_KEY] = next;
  if (import.meta.env.DEV) {
    const debugEnabled = Boolean((globalThis as { __SIGFLO_SCANNER_DEBUG__?: boolean }).__SIGFLO_SCANNER_DEBUG__);
    if (debugEnabled) {
      console.debug('[Sigflo][ScannerLifecycle]', {
        symbol: entry.symbol,
        setupScore: entry.setupScore,
        timingScore: entry.timingScore,
        entryFreshnessScore: entry.entryFreshnessScore,
        roomToTargetScore: entry.roomToTargetScore,
        actionabilityScore: entry.actionabilityScore,
        state: entry.state,
        triggerType: entry.triggerType,
        idealEntryPrice: entry.idealEntryPrice,
        currentPrice: entry.currentPrice,
        atrExtensionFromIdeal: entry.atrExtensionFromIdeal,
        candlesSinceTrigger: entry.candlesSinceTrigger,
        candlesSincePeakTiming: entry.candlesSincePeakTiming,
        penalties: entry.penalties,
        positiveFactors: entry.positiveFactors,
      });
    }
  }
}
