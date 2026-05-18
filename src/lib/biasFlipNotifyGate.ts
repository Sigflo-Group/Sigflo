import type { ExchangeSnapshot, PositionItem } from '@/types/integrations';

/** Ignore dust legs so tiny balances do not subscribe to bias alerts. */
const MIN_BIAS_NOTIFY_POSITION_NOTIONAL_USD = 5;

const BIAS_NOTIFY_FOCUS_STORAGE_KEY = 'sigflo-bias-notify-focus-linear';

/**
 * Scanner bias-flip toasts / OS notifications are limited to symbols where the user
 * has a meaningful open position. {@link syncBiasFlipNotifyOpenSymbolsFromSnapshots}
 * runs whenever a portfolio snapshot refresh finishes (see `AccountSnapshotProvider`).
 *
 * When {@link biasFlipNotifyTradeFocusLinearSymbolRef} is set (last chart symbol from Trade),
 * only that linear symbol may announce — including on Feed/Portfolio — so other open legs
 * do not spam you. If the focused symbol is no longer in the open set, the focus is ignored
 * (stale after closing that leg). Persisted in `sessionStorage` for the tab.
 *
 * Each refresh uses a monotonic {@link nextBiasFlipNotifySyncGeneration} so an older
 * in-flight HTTP response cannot overwrite a newer snapshot (e.g. after closing a leg).
 */
export const biasFlipNotifyOpenLinearSymbolsRef: { current: ReadonlySet<string> } = {
  current: new Set(),
};

/** Linear symbol for the chart pair to receive bias alerts (e.g. `SOLUSDT`). */
export const biasFlipNotifyTradeFocusLinearSymbolRef: { current: string | null } = { current: null };

function persistBiasNotifyFocusToStorage(linearSymbol: string | null): void {
  try {
    if (linearSymbol) sessionStorage.setItem(BIAS_NOTIFY_FOCUS_STORAGE_KEY, linearSymbol);
    else sessionStorage.removeItem(BIAS_NOTIFY_FOCUS_STORAGE_KEY);
  } catch (e) { console.error("[Caught Error]", e); }
}

try {
  if (typeof sessionStorage !== 'undefined') {
    const v = sessionStorage.getItem(BIAS_NOTIFY_FOCUS_STORAGE_KEY)?.trim().toUpperCase();
    if (v) biasFlipNotifyTradeFocusLinearSymbolRef.current = v;
  }
} catch (e) { console.error("[Caught Error]", e); }

export function setBiasFlipNotifyTradeFocusLinearSymbol(linearSymbol: string | null): void {
  const s = linearSymbol?.trim().toUpperCase() ?? '';
  const next = s || null;
  biasFlipNotifyTradeFocusLinearSymbolRef.current = next;
  persistBiasNotifyFocusToStorage(next);
}

function positionCountsForBiasNotify(p: PositionItem): boolean {
  if (!Number.isFinite(p.size) || Math.abs(p.size) === 0) return false;
  const entry = p.entryPrice;
  const mark = p.markPrice;
  const px =
    Number.isFinite(entry) && entry > 0 ? entry : Number.isFinite(mark) && (mark ?? 0) > 0 ? (mark as number) : 0;
  if (!(px > 0)) return false;
  const usd = Math.abs(p.size * px);
  return usd >= MIN_BIAS_NOTIFY_POSITION_NOTIONAL_USD;
}

let biasFlipNotifySyncGen = 0;
let biasFlipNotifyLastAppliedGen = 0;

export function nextBiasFlipNotifySyncGeneration(): number {
  biasFlipNotifySyncGen += 1;
  return biasFlipNotifySyncGen;
}

export function syncBiasFlipNotifyOpenSymbolsFromSnapshots(
  items: readonly ExchangeSnapshot[],
  generation: number,
): void {
  if (generation < biasFlipNotifyLastAppliedGen) return;
  biasFlipNotifyLastAppliedGen = generation;

  const s = new Set<string>();
  for (const snap of items) {
    if (snap.status !== 'connected') continue;
    for (const p of snap.positions) {
      if (!positionCountsForBiasNotify(p)) continue;
      const sym = p.symbol.trim().toUpperCase();
      if (sym) s.add(sym);
    }
  }
  biasFlipNotifyOpenLinearSymbolsRef.current = s;
}

export function shouldAnnounceScannerBiasFlip(linearSymbol: string): boolean {
  const sym = linearSymbol.trim().toUpperCase();
  const open = biasFlipNotifyOpenLinearSymbolsRef.current;
  if (!sym || !open.has(sym)) return false;
  const focus = biasFlipNotifyTradeFocusLinearSymbolRef.current;
  if (focus != null && focus !== sym) {
    if (!open.has(focus)) return true;
    return false;
  }
  return true;
}
