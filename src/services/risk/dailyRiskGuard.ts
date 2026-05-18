import { secureStorage } from '@/lib/storage';
import { useMemo } from 'react';
import type { DailyRiskGuardModel, DailyRiskGuardStatus } from '@/types/riskGuard';
import { useRiskSettings } from '@/services/risk/riskSettings';

const DEMO_OVERRIDE_STORAGE_KEY = 'sigflo_demo_daily_loss_pct';

/**
 * Demo session drawdown as a positive fraction of `maxDailyLossPct` (e.g. 0.55 → −55% of limit as day %).
 * Replace with exchange / ledger daily P&L when available.
 */
/** Below 0.5× limit → normal on first load; set `sigflo_demo_daily_loss_pct` in localStorage to stress warning/locked. */
const DEMO_DEFAULT_LOSS_FRACTION_OF_LIMIT = 0.42;

function readDemoLossPctOverride(): number | null {
  if (typeof window === 'undefined' || false) return null;
  try {
    const raw = secureStorage.getItem(DEMO_OVERRIDE_STORAGE_KEY);
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return n;
  } catch {
    return null;
  }
}

/**
 * Mock daily P&L for the guard. Override for QA: `localStorage.setItem('sigflo_demo_daily_loss_pct', '3')`
 * (with max daily loss 3 → locked). Remove key to use the built-in demo ratio.
 */
export function getDemoDailyPnlSnapshot(maxDailyLossPct: number): { currentDailyPnl: number; currentDailyPnlPct: number } {
  const limit = Math.max(0.5, maxDailyLossPct);
  const override = readDemoLossPctOverride();
  const lossPctOfDay =
    override != null ? Math.min(limit * 2, Math.max(0, Math.abs(override))) : DEMO_DEFAULT_LOSS_FRACTION_OF_LIMIT * limit;
  const currentDailyPnlPct = -lossPctOfDay;
  const currentDailyPnl = -Math.max(1, lossPctOfDay * 24);
  return { currentDailyPnl, currentDailyPnlPct };
}

function statusMessage(status: DailyRiskGuardStatus): string {
  if (status === 'locked') return 'Daily risk limit reached';
  if (status === 'warning') return 'Approaching daily risk limit';
  return 'Within your daily risk envelope';
}

export function buildDailyRiskGuard(input: {
  currentDailyPnl: number;
  currentDailyPnlPct: number;
  dailyLossLimitPct: number;
}): DailyRiskGuardModel {
  const limit = Math.max(0.5, input.dailyLossLimitPct);
  const lossPct = Math.max(0, -input.currentDailyPnlPct);

  let status: DailyRiskGuardStatus;
  if (lossPct >= limit) status = 'locked';
  else if (lossPct >= 0.5 * limit) status = 'warning';
  else status = 'normal';

  return {
    currentDailyPnl: input.currentDailyPnl,
    currentDailyPnlPct: input.currentDailyPnlPct,
    dailyLossLimitPct: limit,
    status,
    message: statusMessage(status),
  };
}

export function riskGuardStatusLine(status: DailyRiskGuardStatus): string {
  if (status === 'locked') return 'Risk guard locked';
  if (status === 'warning') return 'Risk guard warning';
  return 'Risk guard normal';
}

export function useDailyRiskGuard(): DailyRiskGuardModel {
  const { maxDailyLossPct } = useRiskSettings();
  return useMemo(() => {
    const snap = getDemoDailyPnlSnapshot(maxDailyLossPct);
    return buildDailyRiskGuard({
      currentDailyPnl: snap.currentDailyPnl,
      currentDailyPnlPct: snap.currentDailyPnlPct,
      dailyLossLimitPct: maxDailyLossPct,
    });
  }, [maxDailyLossPct]);
}
