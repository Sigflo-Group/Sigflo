export const TRADE_PAIR_FAVORITES_STORAGE_KEY = 'sigflo.tradePairFavorites.v1';
export const TRADE_FAVORITES_CHANGED_EVENT = 'sigflo-trade-favorites-changed';

const MAX_FAVORITES = 48;

/** Normalize signal / trade `pair` to a bare base symbol (e.g. BTC). */
export function normalizeTradePairBase(pair: string): string {
  const raw = pair.trim().toUpperCase();
  const base = raw.includes('/') ? raw.split('/')[0]!.trim() : raw.replace(/USDT$/i, '').trim();
  const clean = base.replace(/[^A-Z0-9]/g, '');
  return clean || 'BTC';
}

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function readTradePairFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of parseList(window.localStorage.getItem(TRADE_PAIR_FAVORITES_STORAGE_KEY))) {
    const b = normalizeTradePairBase(s);
    if (seen.has(b)) continue;
    seen.add(b);
    out.push(b);
    if (out.length >= MAX_FAVORITES) break;
  }
  return out;
}

export function isTradePairFavorite(pair: string): boolean {
  const b = normalizeTradePairBase(pair);
  return readTradePairFavorites().includes(b);
}

/** Persists toggle; returns true if the pair is now favorited. */
export function toggleTradePairFavorite(pair: string): boolean {
  const b = normalizeTradePairBase(pair);
  const list = readTradePairFavorites();
  const i = list.indexOf(b);
  let next: string[];
  let nowFavorited: boolean;
  if (i >= 0) {
    next = list.filter((_, j) => j !== i);
    nowFavorited = false;
  } else {
    next = [...list, b].slice(0, MAX_FAVORITES);
    nowFavorited = true;
  }
  window.localStorage.setItem(TRADE_PAIR_FAVORITES_STORAGE_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRADE_FAVORITES_CHANGED_EVENT));
  }
  return nowFavorited;
}
