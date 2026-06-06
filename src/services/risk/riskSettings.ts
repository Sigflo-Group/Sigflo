import { secureStorage } from '@/lib/storage';
import { useSyncExternalStore } from 'react';
import { getPositionRepository } from '@/services/positions';
import type { SigfloRiskMode, SigfloRiskSettings } from '@/types/risk';

const STORAGE_KEY = 'sigflo_risk_settings_v1';
export const RISK_SETTINGS_CHANGED_EVENT = 'sigflo-risk-settings-changed';

export const DEFAULT_RISK_SETTINGS: SigfloRiskSettings = {
  riskMode: 'Balanced',
  maxRiskPerTradePct: 1,
  maxDailyLossPct: 3,
  maxOpenPositions: 3,
  allowLiveExecution: false,
  requireConfirmation: true,
  paperModeDefault: true,
};

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function coerceRiskMode(v: unknown): SigfloRiskMode {
  if (v === 'Defensive' || v === 'Balanced' || v === 'Aggressive') return v;
  return DEFAULT_RISK_SETTINGS.riskMode;
}

/** LocalStorage / JSON sometimes yields non-boolean toggles; normalize so Risk UI matches execution gates. */
function coerceBooleanField(value: unknown, defaultVal: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  return defaultVal;
}

export function coerceRiskSettings(raw: unknown): SigfloRiskSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_RISK_SETTINGS };
  const o = raw as Record<string, unknown>;
  return {
    riskMode: coerceRiskMode(o.riskMode),
    maxRiskPerTradePct: clamp(Number(o.maxRiskPerTradePct), 0.1, 25),
    maxDailyLossPct: clamp(Number(o.maxDailyLossPct), 0.5, 50),
    maxOpenPositions: Math.round(clamp(Number(o.maxOpenPositions), 1, 25)),
    allowLiveExecution: coerceBooleanField(o.allowLiveExecution, DEFAULT_RISK_SETTINGS.allowLiveExecution),
    requireConfirmation: coerceBooleanField(o.requireConfirmation, DEFAULT_RISK_SETTINGS.requireConfirmation),
    paperModeDefault: coerceBooleanField(o.paperModeDefault, DEFAULT_RISK_SETTINGS.paperModeDefault),
  };
}

/** Same reference when values unchanged — required for `useSyncExternalStore` snapshots. */
let riskSettingsSnapshot: SigfloRiskSettings | null = null;
let riskSettingsSnapshotKey = '';

function readRiskSettingsFromStorage(): SigfloRiskSettings {
  if (typeof window === 'undefined' || false) {
    return { ...DEFAULT_RISK_SETTINGS };
  }
  try {
    const raw = secureStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RISK_SETTINGS };
    return coerceRiskSettings(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_RISK_SETTINGS };
  }
}

function invalidateRiskSettingsSnapshotCache(): void {
  riskSettingsSnapshot = null;
  riskSettingsSnapshotKey = '';
}

export function getRiskSettings(): SigfloRiskSettings {
  const computed = readRiskSettingsFromStorage();
  const key = JSON.stringify(computed);
  if (riskSettingsSnapshot != null && key === riskSettingsSnapshotKey) {
    return riskSettingsSnapshot;
  }
  riskSettingsSnapshotKey = key;
  riskSettingsSnapshot = computed;
  return riskSettingsSnapshot;
}

export function saveRiskSettings(next: SigfloRiskSettings): SigfloRiskSettings {
  const normalized = coerceRiskSettings(next);
  invalidateRiskSettingsSnapshotCache();
  if (typeof window !== 'undefined') {
    try {
      secureStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) { console.error("[Caught Error]", e); }
    try {
      window.dispatchEvent(new CustomEvent(RISK_SETTINGS_CHANGED_EVENT));
    } catch (e) { console.error("[Caught Error]", e); }
  }
  return normalized;
}

export function resetRiskSettings(): SigfloRiskSettings {
  invalidateRiskSettingsSnapshotCache();
  if (typeof window !== 'undefined') {
    try {
      secureStorage.removeItem(STORAGE_KEY);
    } catch (e) { console.error("[Caught Error]", e); }
    try {
      window.dispatchEvent(new CustomEvent(RISK_SETTINGS_CHANGED_EVENT));
    } catch (e) { console.error("[Caught Error]", e); }
  }
  return { ...DEFAULT_RISK_SETTINGS };
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handler);
    window.addEventListener(RISK_SETTINGS_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(RISK_SETTINGS_CHANGED_EVENT, handler);
    };
  }
  return () => {};
}

export function useRiskSettings(): SigfloRiskSettings {
  return useSyncExternalStore(subscribe, getRiskSettings, getRiskSettings);
}

/** Count non-flat linear rows from an exchange snapshot (or 0). */
export function countExchangeOpenLegs(positions: readonly { size: number }[] | null | undefined): number {
  if (!positions?.length) return 0;
  return positions.filter((p) => Math.abs(p.size) > 0).length;
}

/** Sum open legs across all connected exchange snapshots (cross-venue risk cap). */
export function countAllConnectedExchangeOpenLegs(
  snapshots: readonly { status: string; positions?: readonly { size: number }[] }[],
): number {
  let total = 0;
  for (const snap of snapshots) {
    if (snap.status !== 'connected') continue;
    total += countExchangeOpenLegs(snap.positions);
  }
  return total;
}

/**
 * Positions counted toward max-open risk: prefer live exchange legs; if none, demo repository rows
 * (so the Bots strip still exercises the warning in demo).
 */
export function activePositionCountForRisk(exchangeOpenLegs: number): number {
  if (exchangeOpenLegs > 0) return exchangeOpenLegs;
  return getPositionRepository().listActivePositions().length;
}
