import type { ScannerTimingState } from '@/lib/scannerConfig';
import type { SignalSetupType } from '@/types/signal';

export type ScannerFunnelStage =
  | 'skip_no_ticker'
  | 'skip_insufficient_candles'
  | 'skip_btc_eth_warmup'
  | 'skip_no_detector'
  | 'skip_below_emit_threshold'
  | 'emitted'
  | 'emitted_cooldown_suppressed';

export type SymbolPipelineReport = {
  symbol: string;
  stage: ScannerFunnelStage;
  setupType?: SignalSetupType;
  side?: 'long' | 'short';
  timingState?: ScannerTimingState;
  setupScore?: number;
  actionabilityScore?: number;
  entryFreshnessScore?: number;
  timingScore?: number;
  triggerHit?: boolean;
  triggerType?: string;
  emitThreshold?: number;
  detectorHits?: string[];
  notTriggeredReasons?: string[];
  ts: number;
};

export type ScannerPipelineHealthSnapshot = {
  updatedAt: number;
  engineMode: string;
  connection: string;
  streamReady: boolean;
  wsConnected: boolean;
  symbolsScanned: number;
  funnel: Record<ScannerFunnelStage, number>;
  timingStates: Record<ScannerTimingState | 'unknown', number>;
  triggeredPairs: string[];
  lastBySymbol: Record<string, SymbolPipelineReport>;
  recent: SymbolPipelineReport[];
};

const MAX_RECENT = 48;

function emptyFunnel(): Record<ScannerFunnelStage, number> {
  return {
    skip_no_ticker: 0,
    skip_insufficient_candles: 0,
    skip_btc_eth_warmup: 0,
    skip_no_detector: 0,
    skip_below_emit_threshold: 0,
    emitted: 0,
    emitted_cooldown_suppressed: 0,
  };
}

function emptyTimingStates(): Record<ScannerTimingState | 'unknown', number> {
  return {
    developing: 0,
    ready: 0,
    triggered: 0,
    extended: 0,
    expired: 0,
    unknown: 0,
  };
}

let snapshot: ScannerPipelineHealthSnapshot = {
  updatedAt: 0,
  engineMode: 'REST',
  connection: 'disconnected',
  streamReady: false,
  wsConnected: false,
  symbolsScanned: 0,
  funnel: emptyFunnel(),
  timingStates: emptyTimingStates(),
  triggeredPairs: [],
  lastBySymbol: {},
  recent: [],
};

export function getScannerPipelineHealth(): ScannerPipelineHealthSnapshot {
  return snapshot;
}

export function isScannerDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  return Boolean((globalThis as { __SIGFLO_SCANNER_DEBUG__?: boolean }).__SIGFLO_SCANNER_DEBUG__);
}

export function explainNotTriggered(args: {
  timingState?: ScannerTimingState;
  triggerHit?: boolean;
  actionabilityScore?: number;
  entryFreshnessScore?: number;
  triggeredActionabilityMin: number;
  triggeredFreshnessMin: number;
}): string[] {
  const out: string[] = [];
  if (!args.triggerHit) out.push('no_breakout_trigger_close');
  if (args.timingState === 'extended') out.push('lifecycle_extended');
  if (args.timingState === 'expired') out.push('lifecycle_expired');
  if (args.timingState === 'developing' || args.timingState === 'ready') {
    out.push(`lifecycle_${args.timingState}`);
  }
  if ((args.actionabilityScore ?? 0) < args.triggeredActionabilityMin) {
    out.push(`actionability_below_${args.triggeredActionabilityMin}`);
  }
  if ((args.entryFreshnessScore ?? 0) < args.triggeredFreshnessMin) {
    out.push(`freshness_below_${args.triggeredFreshnessMin}`);
  }
  if (args.timingState === 'triggered') return [];
  return out;
}

export function recordScannerPipelineReport(
  report: SymbolPipelineReport,
  ctx: {
    engineMode: string;
    connection: string;
    streamReady: boolean;
    wsConnected: boolean;
    triggeredPairs: string[];
  },
): void {
  const funnel = emptyFunnel();
  const timingStates = emptyTimingStates();
  const lastBySymbol = { ...snapshot.lastBySymbol, [report.symbol]: report };
  const recent = [...snapshot.recent, report].slice(-MAX_RECENT);

  for (const r of Object.values(lastBySymbol)) {
    funnel[r.stage] += 1;
    const ts = r.timingState ?? 'unknown';
    timingStates[ts] += 1;
  }

  snapshot = {
    updatedAt: Date.now(),
    engineMode: ctx.engineMode,
    connection: ctx.connection,
    streamReady: ctx.streamReady,
    wsConnected: ctx.wsConnected,
    symbolsScanned: Object.keys(lastBySymbol).length,
    funnel,
    timingStates,
    triggeredPairs: [...ctx.triggeredPairs],
    lastBySymbol,
    recent,
  };

  if (typeof globalThis !== 'undefined') {
    (globalThis as { __SIGFLO_SCANNER_HEALTH__?: ScannerPipelineHealthSnapshot }).__SIGFLO_SCANNER_HEALTH__ =
      snapshot;
  }

  if (!isScannerDebugEnabled()) return;

  const triggeredN = ctx.triggeredPairs.length;
  console.log('[Sigflo][ScannerHealth]', {
    mode: ctx.engineMode,
    connection: ctx.connection,
    streamReady: ctx.streamReady,
    triggeredPairs: triggeredN,
    funnel,
    timingStates,
    last: report,
  });
}

export function logScannerHealthSummary(): void {
  const h = snapshot;
  if (!h.updatedAt) return;
  console.log('[Sigflo][ScannerHealth] summary', {
    triggeredPairs: h.triggeredPairs,
    funnel: h.funnel,
    timingStates: h.timingStates,
    streamReady: h.streamReady,
    connection: h.connection,
  });
}
