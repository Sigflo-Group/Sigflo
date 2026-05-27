import { secureStorage } from '@/lib/storage';
import { baseBots, type BotAgent } from '@/lib/bots';

const STORAGE_KEY = 'sigflo.botUserConfig.v1';

export type BotUserRiskLevel = 'low' | 'medium' | 'high';
export type BotTradeFrequency = 'low' | 'medium' | 'high';
export type BotStopBehavior = 'tight' | 'normal' | 'wide';
export type BotRiskUnit = 'percent' | 'dollar';

export type BotUserConfig = {
  watchedPairs: string[];
  riskLevel: BotUserRiskLevel;
  /** Empty = use canonical agent name */
  displayName: string;
  tradeFrequency: BotTradeFrequency;
  riskUnit: BotRiskUnit;
  riskPerTradePct: number;
  riskPerTradeUsd: number | null;
  maxActiveTrades: number;
  defaultPositionSizeUsd: number;
  stopBehavior: BotStopBehavior;
  autoMoveStop: boolean;
  autoScaleOut: boolean;
  updatedAt: number;
};

export const DEFAULT_ADD_BOT_MARKETS = ['BTC', 'ETH', 'SOL'] as const;

export const CORE_MARKET_OPTIONS = ['BTC', 'ETH', 'SOL'] as const;

export function riskLevelToRiskMode(level: BotUserRiskLevel): BotAgent['riskMode'] {
  if (level === 'low') return 'defensive';
  if (level === 'high') return 'aggressive';
  return 'balanced';
}

function riskModeToUserRisk(mode: BotAgent['riskMode']): BotUserRiskLevel {
  if (mode === 'defensive') return 'low';
  if (mode === 'aggressive') return 'high';
  return 'medium';
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Normalize user market tokens to short symbols (BTC not BTCUSDT). */
export function normalizeMarketTokens(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    let u = t.trim().toUpperCase();
    u = u.replace(/\/USDT$/i, '').replace(/USDT$/i, '');
    u = u.replace(/[^A-Z0-9]/g, '');
    if (u.length < 2 || u.length > 12) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out.slice(0, 16);
}

export function defaultBotUserConfigFromAgent(base: BotAgent): BotUserConfig {
  return {
    watchedPairs: normalizeMarketTokens([...base.watchedPairs]),
    riskLevel: riskModeToUserRisk(base.riskMode),
    displayName: '',
    tradeFrequency: 'medium',
    riskUnit: 'percent',
    riskPerTradePct: 1,
    riskPerTradeUsd: 50,
    maxActiveTrades: 3,
    defaultPositionSizeUsd: 150,
    stopBehavior: 'normal',
    autoMoveStop: false,
    autoScaleOut: true,
    updatedAt: Date.now(),
  };
}

function coerceTradeFrequency(v: unknown): BotTradeFrequency {
  if (v === 'low' || v === 'high') return v;
  return 'medium';
}

function coerceStopBehavior(v: unknown): BotStopBehavior {
  if (v === 'tight' || v === 'wide') return v;
  return 'normal';
}

function coerceRiskUnit(v: unknown): BotRiskUnit {
  return v === 'dollar' ? 'dollar' : 'percent';
}

function omitUndefined<T extends Record<string, unknown>>(o: Partial<T>): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o) as [keyof T, T[keyof T]][]) {
    if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
  }
  return out;
}

function mergeConfigLayer(
  defaults: BotUserConfig,
  existing: Partial<BotUserConfig> | undefined,
  patch: Partial<BotUserConfig>,
): BotUserConfig {
  const m: BotUserConfig = {
    ...defaults,
    ...omitUndefined((existing ?? {}) as Record<string, unknown>) as Partial<BotUserConfig>,
    ...omitUndefined(patch as Record<string, unknown>) as Partial<BotUserConfig>,
    updatedAt: Date.now(),
  };
  m.watchedPairs = normalizeMarketTokens(m.watchedPairs);
  if (m.watchedPairs.length === 0) m.watchedPairs = [...defaults.watchedPairs];
  m.riskLevel =
    m.riskLevel === 'low' || m.riskLevel === 'high' || m.riskLevel === 'medium' ? m.riskLevel : defaults.riskLevel;
  m.displayName = typeof m.displayName === 'string' ? m.displayName : '';
  m.tradeFrequency = coerceTradeFrequency(m.tradeFrequency);
  m.stopBehavior = coerceStopBehavior(m.stopBehavior);
  m.riskUnit = coerceRiskUnit(m.riskUnit);
  m.riskPerTradePct = clamp(Number(m.riskPerTradePct) || defaults.riskPerTradePct, 0.1, 10);
  m.riskPerTradeUsd =
    m.riskPerTradeUsd != null && Number.isFinite(Number(m.riskPerTradeUsd))
      ? clamp(Number(m.riskPerTradeUsd), 1, 1_000_000)
      : null;
  m.maxActiveTrades = clamp(Math.round(Number(m.maxActiveTrades) || defaults.maxActiveTrades), 1, 10);
  m.defaultPositionSizeUsd = clamp(
    Number(m.defaultPositionSizeUsd) || defaults.defaultPositionSizeUsd,
    5,
    500_000,
  );
  m.autoMoveStop = Boolean(m.autoMoveStop);
  m.autoScaleOut = m.autoScaleOut !== false;
  return m;
}

function defaultsForBotId(botId: string): BotUserConfig {
  const base = baseBots.find((b) => b.id === botId);
  if (base) return defaultBotUserConfigFromAgent(base);
  return mergeConfigLayer(
    {
      watchedPairs: ['BTC', 'ETH', 'SOL'],
      riskLevel: 'medium',
      displayName: '',
      tradeFrequency: 'medium',
      riskUnit: 'percent',
      riskPerTradePct: 1,
      riskPerTradeUsd: 50,
      maxActiveTrades: 3,
      defaultPositionSizeUsd: 150,
      stopBehavior: 'normal',
      autoMoveStop: false,
      autoScaleOut: true,
      updatedAt: Date.now(),
    },
    undefined,
    {},
  );
}

/** Migrate legacy rows (only watchedPairs + riskLevel) to full BotUserConfig. */
function coerceStoredEntry(botId: string, raw: unknown): BotUserConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const defaults = defaultsForBotId(botId);
  const pairs = Array.isArray(o.watchedPairs) ? normalizeMarketTokens(o.watchedPairs.map(String)) : [];
  const risk =
    o.riskLevel === 'low' || o.riskLevel === 'high' || o.riskLevel === 'medium' ? o.riskLevel : defaults.riskLevel;
  const legacy: Partial<BotUserConfig> = {
    watchedPairs: pairs.length > 0 ? pairs : defaults.watchedPairs,
    riskLevel: risk,
    displayName: typeof o.displayName === 'string' ? o.displayName : '',
    tradeFrequency: coerceTradeFrequency(o.tradeFrequency),
    riskUnit: coerceRiskUnit(o.riskUnit),
    riskPerTradePct: typeof o.riskPerTradePct === 'number' ? o.riskPerTradePct : undefined,
    riskPerTradeUsd:
      o.riskPerTradeUsd === null
        ? null
        : typeof o.riskPerTradeUsd === 'number'
          ? o.riskPerTradeUsd
          : undefined,
    maxActiveTrades: typeof o.maxActiveTrades === 'number' ? o.maxActiveTrades : undefined,
    defaultPositionSizeUsd: typeof o.defaultPositionSizeUsd === 'number' ? o.defaultPositionSizeUsd : undefined,
    stopBehavior: coerceStopBehavior(o.stopBehavior),
    autoMoveStop: typeof o.autoMoveStop === 'boolean' ? o.autoMoveStop : undefined,
    autoScaleOut: typeof o.autoScaleOut === 'boolean' ? o.autoScaleOut : undefined,
    updatedAt: typeof o.updatedAt === 'number' && Number.isFinite(o.updatedAt) ? o.updatedAt : Date.now(),
  };
  return mergeConfigLayer(defaults, {}, legacy);
}

export function loadBotUserConfigMap(): Record<string, BotUserConfig> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = secureStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, BotUserConfig> = {};
    for (const [id, v] of Object.entries(parsed)) {
      const c = coerceStoredEntry(id, v);
      if (c) out[id] = c;
    }
    return out;
  } catch {
    return {};
  }
}

export function persistBotUserConfigMap(map: Record<string, BotUserConfig>) {
  if (typeof window === 'undefined') return;
  secureStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function mergeBotConfigPatch(
  botId: string,
  prev: BotUserConfig | undefined,
  patch: Partial<BotUserConfig>,
): BotUserConfig {
  const defaults = defaultsForBotId(botId);
  return mergeConfigLayer(defaults, prev, patch);
}

export function mergeBotWithUserConfig(base: BotAgent, c?: BotUserConfig): BotAgent {
  if (!c || c.watchedPairs.length === 0) return base;
  const watchedPairs = normalizeMarketTokens(c.watchedPairs);
  if (watchedPairs.length === 0) return base;
  const name = c.displayName.trim() ? c.displayName.trim() : base.name;
  return {
    ...base,
    name,
    watchedPairs,
    riskMode: riskLevelToRiskMode(c.riskLevel),
    activityLine: `Monitoring ${watchedPairs.join(', ')}…`,
  };
}

/** One-line preview for the settings screen (deterministic from key knobs). */
export function buildBotSettingsSummaryLine(args: {
  displayName: string;
  tradeFrequency: BotTradeFrequency;
  stopBehavior: BotStopBehavior;
  riskLevel: BotUserRiskLevel;
}): string {
  const name = args.displayName.trim() || 'This agent';
  const cadence =
    args.tradeFrequency === 'low'
      ? 'trade less frequently'
      : args.tradeFrequency === 'high'
        ? 'scan for setups more often'
        : '';
  const stops =
    args.stopBehavior === 'tight'
      ? 'tighter stops'
      : args.stopBehavior === 'wide'
        ? 'wider stops'
        : '';
  const risk =
    args.riskLevel === 'low'
      ? 'a conservative risk stance'
      : args.riskLevel === 'high'
        ? 'a more aggressive risk stance'
        : '';

  if (cadence && stops) {
    let out = `${name} will now ${cadence} with ${stops}`;
    if (risk) out += `, and ${risk}`;
    return `${out}.`;
  }
  if (cadence && risk) {
    return `${name} will now ${cadence}, leaning toward ${risk}.`;
  }
  if (cadence) {
    return `${name} will now ${cadence}.`;
  }
  if (stops && risk) {
    return `${name} will now use ${stops} with ${risk}.`;
  }
  if (stops) {
    return `${name} will now use ${stops}.`;
  }
  if (risk) {
    return `${name} will now emphasize ${risk}.`;
  }
  return `${name} is set to steady scanning, normal stops, and balanced risk.`;
}

export type AddBotTemplate = {
  id: 'bot-kai' | 'bot-nova' | 'bot-rio';
  name: string;
  archetype: string;
  tagline: string;
  accentClass: string;
  borderActiveClass: string;
};

export const ADD_BOT_TEMPLATES: AddBotTemplate[] = [
  {
    id: 'bot-kai',
    name: 'Kai',
    archetype: 'Momentum',
    tagline: 'Rides trends. Lets winners run.',
    accentClass: 'from-emerald-500/15 to-[#171A20]',
    borderActiveClass: 'border-emerald-400/45',
  },
  {
    id: 'bot-nova',
    name: 'Nova',
    archetype: 'Breakout',
    tagline: 'Finds moves early. Locks in gains.',
    accentClass: 'from-cyan-500/15 to-[#171A20]',
    borderActiveClass: 'border-cyan-400/45',
  },
  {
    id: 'bot-rio',
    name: 'Rio',
    archetype: 'Reversal',
    tagline: 'Protects capital. Exits early.',
    accentClass: 'from-rose-500/12 to-[#171A20]',
    borderActiveClass: 'border-rose-400/40',
  },
];
