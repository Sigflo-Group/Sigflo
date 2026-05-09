import type { AiSnapshotStore, AiStateSnapshot } from '@/types/aiSnapshot';
import type { MarketMemorySnapshot } from '@/lib/marketMemory';
import type { CryptoSignal, SignalLifecycleEvent } from '@/types/signal';
import type { RegimePredictorOutput } from '@/types/regimePredictor';

export const AI_SNAPSHOT_STORE_KEY = '__SIGFLO_AI_SNAPSHOT_LOG_V1__';

const MAX_SNAPSHOTS_PER_SERIES = 400;

export function createEmptyAiSnapshotStore(): AiSnapshotStore {
  return { version: 1, series: {}, _fp: {} };
}

export function loadAiSnapshotStore(): AiSnapshotStore {
  try {
    const raw = globalThis.localStorage?.getItem(AI_SNAPSHOT_STORE_KEY);
    if (!raw) return createEmptyAiSnapshotStore();
    const parsed = JSON.parse(raw) as AiSnapshotStore;
    if (!parsed || parsed.version !== 1 || typeof parsed.series !== 'object' || parsed.series == null) {
      return createEmptyAiSnapshotStore();
    }
    const series: Record<string, AiStateSnapshot[]> = {};
    for (const [k, arr] of Object.entries(parsed.series)) {
      if (!Array.isArray(arr)) continue;
      series[k] = arr.filter(isValidSnapshot);
    }
    const _fp =
      parsed._fp && typeof parsed._fp === 'object' ? (parsed._fp as Record<string, string>) : {};
    return { version: 1, series, _fp };
  } catch {
    return createEmptyAiSnapshotStore();
  }
}

export function persistAiSnapshotStore(store: AiSnapshotStore): void {
  try {
    globalThis.localStorage?.setItem(AI_SNAPSHOT_STORE_KEY, JSON.stringify(store));
  } catch {
    // quota / privacy — in-memory ref still holds latest
  }
}

function isValidSnapshot(s: unknown): s is AiStateSnapshot {
  if (!s || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  return typeof o.timestamp === 'number' && typeof o.symbol === 'string' && typeof o.price === 'number';
}

export function findActiveLifecycleEvent(
  events: SignalLifecycleEvent[],
  symbol: string,
): SignalLifecycleEvent | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!;
    if (e.symbol !== symbol) continue;
    if (e.status === 'completed' || e.status === 'archived') continue;
    return e;
  }
  return null;
}

function seriesKey(args: { crypto: CryptoSignal | null; lifecycle: SignalLifecycleEvent | null; symbol: string }): string {
  if (args.crypto?.id) return args.crypto.id;
  if (args.lifecycle?.id) return args.lifecycle.id;
  return `${args.symbol}::__ambient__`;
}

function buildSnapshot(args: {
  symbol: string;
  price: number;
  memory: MarketMemorySnapshot;
  crypto: CryptoSignal | null;
  lifecycle: SignalLifecycleEvent | null;
  regimePredictor: RegimePredictorOutput | null;
  now: number;
}): AiStateSnapshot {
  const { memory: m, crypto: c, lifecycle: ev } = args;
  const confidence = c?.confidence ?? c?.setupScore ?? ev?.confidence ?? m.recentSignals.at(-1)?.confidence ?? 0;
  const biasRaw = c?.side ?? ev?.bias ?? null;
  const bias: AiStateSnapshot['bias'] = biasRaw === 'long' || biasRaw === 'short' ? biasRaw : 'neutral';
  const setupRaw = c?.setupType ?? ev?.setupType ?? null;
  const setupType: AiStateSnapshot['setupType'] =
    setupRaw === 'breakout' || setupRaw === 'pullback' || setupRaw === 'overextended' ? setupRaw : 'none';
  const invalidationLevel = ev?.invalidationLevel ?? 0;
  const activeSignalId = c?.id ?? ev?.id ?? '';

  return {
    timestamp: args.now,
    symbol: args.symbol,
    timeframe: '15m',
    price: args.price,
    bias,
    confidence,
    setupType,
    marketRegime: m.regime,
    momentumState: m.momentumState,
    volatilityState: m.volatilityState,
    signalLifecycleStage: m.lifecycleStage,
    keyReasons: c?.reasons ? [...c.reasons] : [],
    riskNotes: c?.warnings ? [...c.warnings] : [],
    invalidationLevel,
    activeSignalId,
    regimePredictor: args.regimePredictor
      ? {
          currentRegime: args.regimePredictor.currentRegime,
          regimeStability: args.regimePredictor.regimeStability,
          shiftProbability: args.regimePredictor.shiftProbability,
          likelyNextRegime: args.regimePredictor.likelyNextRegime,
          earlyWarningSignals: [...args.regimePredictor.earlyWarningSignals],
          transitionPressures: { ...args.regimePredictor.transitionPressures },
        }
      : undefined,
  };
}

type CompareBundle = {
  snap: AiStateSnapshot;
  breakoutStatus: MarketMemorySnapshot['breakoutStatus'];
  structuralMemoryScore: number;
  failedBreakoutsRecent: number;
  lifecycleStatus: SignalLifecycleEvent['status'] | null;
  notesLen: number;
  outcome: SignalLifecycleEvent['outcome'];
};

function toBundle(
  snap: AiStateSnapshot,
  memory: MarketMemorySnapshot,
  lifecycle: SignalLifecycleEvent | null,
): CompareBundle {
  return {
    snap,
    breakoutStatus: memory.breakoutStatus,
    structuralMemoryScore: memory.structuralMemoryScore,
    failedBreakoutsRecent: memory.failedBreakoutsRecent,
    lifecycleStatus: lifecycle?.status ?? null,
    notesLen: lifecycle?.notes.length ?? 0,
    outcome: lifecycle?.outcome ?? null,
  };
}

/** Fingerprint of semantic state only (excludes price) for dedupe and light writes. */
function stableFingerprint(bundle: CompareBundle): string {
  const s = bundle.snap;
  return JSON.stringify({
    c: s.confidence,
    r: s.marketRegime,
    mo: s.momentumState,
    v: s.volatilityState,
    st: s.signalLifecycleStage,
    b: s.bias,
    su: s.setupType,
    inv: s.invalidationLevel,
    aid: s.activeSignalId,
    br: bundle.breakoutStatus,
    sms: Math.round(bundle.structuralMemoryScore),
    fb: bundle.failedBreakoutsRecent,
    ls: bundle.lifecycleStatus,
    nl: bundle.notesLen,
    oc: bundle.outcome,
    kr: s.keyReasons,
    rn: s.riskNotes,
    rp: s.regimePredictor
      ? {
          st: s.regimePredictor.regimeStability,
          sp: s.regimePredictor.shiftProbability,
          nx: s.regimePredictor.likelyNextRegime,
          ew: s.regimePredictor.earlyWarningSignals,
          tp: s.regimePredictor.transitionPressures,
        }
      : null,
  });
}

function appendToSeries(store: AiSnapshotStore, key: string, snapshot: AiStateSnapshot): AiSnapshotStore {
  const prevArr = store.series[key] ?? [];
  const nextArr = [...prevArr, snapshot].slice(-MAX_SNAPSHOTS_PER_SERIES);
  return {
    ...store,
    series: { ...store.series, [key]: nextArr },
  };
}

/**
 * Append one snapshot when semantic engine state changes (price excluded from dedupe).
 * Snapshots themselves are immutable; store `_fp` is telemetry bookkeeping only.
 */
export function appendAiSnapshotIfTriggered(args: {
  store: AiSnapshotStore;
  symbol: string;
  price: number;
  memory: MarketMemorySnapshot;
  cryptoSignal: CryptoSignal | null;
  activeLifecycle: SignalLifecycleEvent | null;
  regimePredictor: RegimePredictorOutput | null;
  now: number;
}): { store: AiSnapshotStore; appended: boolean } {
  const key = seriesKey({
    crypto: args.cryptoSignal,
    lifecycle: args.activeLifecycle,
    symbol: args.symbol,
  });
  const snap = buildSnapshot({
    symbol: args.symbol,
    price: args.price,
    memory: args.memory,
    crypto: args.cryptoSignal,
    lifecycle: args.activeLifecycle,
    regimePredictor: args.regimePredictor,
    now: args.now,
  });
  const bundle = toBundle(snap, args.memory, args.activeLifecycle);
  const fp = stableFingerprint(bundle);
  const prevFp = args.store._fp?.[key];
  if (prevFp === fp) return { store: args.store, appended: false };

  const withSeries = appendToSeries(args.store, key, snap);
  return {
    store: {
      ...withSeries,
      _fp: { ...(withSeries._fp ?? {}), [key]: fp },
    },
    appended: true,
  };
}

/** Snapshots for one logical signal id (crypto id or lifecycle id). */
export function querySnapshotsBySignalId(
  store: AiSnapshotStore,
  signalId: string,
  startTs?: number,
  endTs?: number,
): AiStateSnapshot[] {
  const arr = store.series[signalId];
  if (!arr?.length) return [];
  return filterRange(arr, startTs, endTs);
}

/** Resolves lifecycle store ids (`{cryptoId}-evt`) to possible series keys. */
export function seriesKeysForLifecycleEventId(lifecycleEventId: string): string[] {
  const keys = [lifecycleEventId];
  if (lifecycleEventId.endsWith('-evt')) {
    const base = lifecycleEventId.slice(0, -'-evt'.length);
    if (base.length > 0) keys.push(base);
  }
  return keys;
}

/** Merges snapshot series for a lifecycle event (crypto-keyed + optional `-evt` key), time-sorted. */
export function querySnapshotsForLifecycleEventId(
  store: AiSnapshotStore,
  lifecycleEventId: string,
  startTs?: number,
  endTs?: number,
): AiStateSnapshot[] {
  const seen = new Set<string>();
  const out: AiStateSnapshot[] = [];
  for (const key of seriesKeysForLifecycleEventId(lifecycleEventId)) {
    for (const s of store.series[key] ?? []) {
      const id = `${s.timestamp}:${s.activeSignalId}:${s.confidence}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(s);
    }
  }
  out.sort((a, b) => a.timestamp - b.timestamp);
  return filterRange(out, startTs, endTs);
}

/** All snapshots for a symbol across series, time-sorted. */
export function querySnapshotsForSymbol(
  store: AiSnapshotStore,
  symbol: string,
  startTs?: number,
  endTs?: number,
): AiStateSnapshot[] {
  const out: AiStateSnapshot[] = [];
  for (const series of Object.values(store.series)) {
    for (const s of series) {
      if (s.symbol === symbol) out.push(s);
    }
  }
  out.sort((a, b) => a.timestamp - b.timestamp);
  if (startTs == null && endTs == null) return out;
  return out.filter((s) => (startTs == null || s.timestamp >= startTs) && (endTs == null || s.timestamp <= endTs));
}

function filterRange(arr: AiStateSnapshot[], startTs?: number, endTs?: number): AiStateSnapshot[] {
  if (startTs == null && endTs == null) return [...arr];
  return arr.filter((s) => (startTs == null || s.timestamp >= startTs) && (endTs == null || s.timestamp <= endTs));
}

/** Nearest snapshot at or before `timestamp` for a signal id (binary search). */
export function snapshotAtOrBefore(store: AiSnapshotStore, signalId: string, timestamp: number): AiStateSnapshot | null {
  const arr = store.series[signalId];
  if (!arr?.length) return null;
  let lo = 0;
  let hi = arr.length - 1;
  let best: AiStateSnapshot | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = arr[mid]!.timestamp;
    if (t <= timestamp) {
      best = arr[mid]!;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}
