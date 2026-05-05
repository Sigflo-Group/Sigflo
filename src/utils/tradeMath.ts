import type { PaperTradeInput, PaperTradeResult } from '@/types/paperTrade';

/**
 * Pull the first numeric price from a label (engine copy, locale-formatted, etc.).
 * Strips thousands separators and currency symbols before parsing.
 */
export function parsePriceFromString(str: string | undefined | null): number | null {
  if (str == null) return null;
  const t = str.trim();
  if (!t) return null;
  const normalized = t.replace(/\$/g, '').replace(/,/g, '');
  const m = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!m?.[0]) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** All positive finite numbers in order (for ranges like "65,100 - 65,200"). */
function parseAllPricesFromString(str: string | undefined | null): number[] {
  if (str == null) return [];
  const normalized = str.replace(/\$/g, '').replace(/,/g, '');
  const matches = normalized.match(/-?\d+(?:\.\d+)?/g) ?? [];
  const out: number[] = [];
  for (const raw of matches) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

/** Entry zone string → midpoint of first two prices, or single price if only one. */
export function parseEntryZoneMidpoint(zone: string | undefined | null): number | null {
  const nums = parseAllPricesFromString(zone ?? '');
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0]!;
  return (nums[0]! + nums[1]!) / 2;
}

export function parseTargetPrices(targets: string[] | undefined): number[] {
  if (!targets?.length) return [];
  const out: number[] = [];
  for (const row of targets) {
    const p = parsePriceFromString(row);
    if (p != null) out.push(p);
  }
  return out;
}

/** Bots review: geometric sanity for stop vs entry and each target vs entry (plan-only UI). */
export type BotsPaperPlanValidation = {
  ok: boolean;
  stopOk: boolean;
  targetsOk: boolean;
  stopWarning: string | null;
  targetsWarning: string | null;
};

export function validateBotsPaperPlan(
  entryPrice: number,
  stopPrice: number,
  targets: readonly number[],
  direction: 'LONG' | 'SHORT',
): BotsPaperPlanValidation {
  const stopOk = direction === 'LONG' ? stopPrice < entryPrice : stopPrice > entryPrice;
  const stopWarning = stopOk
    ? null
    : direction === 'LONG'
      ? 'Stop must be below entry for LONG'
      : 'Stop must be above entry for SHORT';

  let targetsOk = true;
  let targetsWarning: string | null = null;
  for (const t of targets) {
    if (!Number.isFinite(t) || t <= 0) continue;
    const ok = direction === 'LONG' ? t > entryPrice : t < entryPrice;
    if (!ok) {
      targetsOk = false;
      targetsWarning =
        direction === 'LONG' ? 'Targets must be above entry for LONG' : 'Targets must be below entry for SHORT';
      break;
    }
  }

  return {
    stopOk,
    targetsOk,
    ok: stopOk && targetsOk,
    stopWarning,
    targetsWarning,
  };
}

export function calculatePaperTrade(input: PaperTradeInput): PaperTradeResult | null {
  const { balance, riskPercent, entryPrice, stopPrice, targets, direction } = input;
  if (!Number.isFinite(balance) || balance <= 0) return null;
  if (!Number.isFinite(riskPercent) || riskPercent <= 0) return null;
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) return null;
  if (!Number.isFinite(stopPrice) || stopPrice <= 0) return null;

  const riskAmount = balance * (riskPercent / 100);
  if (!Number.isFinite(riskAmount) || riskAmount <= 0) return null;

  const distanceToStop =
    direction === 'LONG' ? entryPrice - stopPrice : stopPrice - entryPrice;
  if (!Number.isFinite(distanceToStop) || distanceToStop <= 0) return null;

  const positionSize = riskAmount / distanceToStop;
  if (!Number.isFinite(positionSize) || positionSize <= 0) return null;

  const lossAtStop = riskAmount;

  const profitTargets: PaperTradeResult['profitTargets'] = [];
  for (const target of targets) {
    if (!Number.isFinite(target) || target <= 0) continue;
    const pnl =
      direction === 'LONG' ? (target - entryPrice) * positionSize : (entryPrice - target) * positionSize;
    const rr = riskAmount > 0 ? pnl / riskAmount : 0;
    profitTargets.push({ price: target, pnl, rr });
  }

  return {
    positionSize,
    riskAmount,
    lossAtStop,
    profitTargets,
  };
}
