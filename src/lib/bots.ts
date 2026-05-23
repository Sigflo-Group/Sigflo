import { deriveMarketStatus } from '@/lib/marketScannerRows';
import type { UiSignalState } from '@/lib/signalState';
import { uiSignalStateFromMarketStatus, uiSignalStateLabel } from '@/lib/signalState';
import type { CryptoSignal } from '@/types/signal';

/** Bots home “Recent Activity” list (pair + status rows). */
export const BOTS_RECENT_ACTIVITY_MAX = 10;

export type BotStatus = 'active' | 'scanning' | 'paused';

/** Resolved row status for bot cards (includes signal-derived states). */
export type BotCardStatus = 'active' | 'scanning' | 'paused' | 'setup_forming' | 'in_trade';

export type BotRuntimeStats = {
  signalsToday: number;
  winRatePct: number;
  lastResultPct: number;
};

export type BotSetupTypeLabel = 'Breakout' | 'Pullback' | 'Reversal';

export type BotMarketContext = {
  volatility: 'Low' | 'Medium' | 'High';
  structure: 'Trending' | 'Ranging';
  volume: 'Weak' | 'Building' | 'Strong';
};

export type BotExpandDetail = {
  setupStateLabel: string;
  bias: string;
  /** 0–100, shown as confidence */
  confidencePct: number;
  aiNote: string;
  /** Shown in thinking layer; 1–2 short lines. Falls back to trimmed `aiNote` if missing. */
  commentaryShort?: string;
  setupType: BotSetupTypeLabel;
  marketContext: BotMarketContext;
  entry?: number;
  stop?: number;
  target?: number;
};

/** Distinct exit / risk temperament (Kai / Nova / Rio). */
export type BotPersonalityId = 'kai' | 'nova' | 'rio';

export type BotPersonalityProfile = {
  id: BotPersonalityId;
  /** Short UI label, e.g. “Momentum · patient” */
  label: string;
  /** One-line description for focus screen */
  tagline: string;
  /** Three bullets for “how this agent trades” */
  traits: readonly [string, string, string];
  /** Appended to Exit AI context for transparency */
  exitAiNote: string;
  /** Ultra-short stance for multi-bot comparison row */
  comparisonStance: string;
};

export const BOT_PERSONALITY: Record<BotPersonalityId, BotPersonalityProfile> = {
  kai: {
    id: 'kai',
    label: 'Momentum · patient',
    tagline: 'Holds longer through noise, wider stops, lets trends pay.',
    traits: ['Wider stop buffer', 'Adds on clean continuation', 'Defers trims until extension fades'],
    exitAiNote:
      'Agent style (Kai): favors holding through chop; widens invalidation before scaling out.',
    comparisonStance: 'Hold',
  },
  nova: {
    id: 'nova',
    label: 'Breakout · balanced',
    tagline: 'Scales out in stages; balances protection with upside.',
    traits: ['Partial trims near targets', 'Balanced risk trims', 'Structure-aware scaling'],
    exitAiNote: 'Agent style (Nova): prefers staged exits and balanced trims as structure evolves.',
    comparisonStance: 'Scale out',
  },
  rio: {
    id: 'rio',
    label: 'Reversal · defensive',
    tagline: 'Tight stops, early invalidation exits, capital first.',
    traits: ['Tighter invalidation', 'Early stand-aside', 'Defensive after rejection'],
    exitAiNote: 'Agent style (Rio): tightens risk quickly when thesis weakens; favors early protection.',
    comparisonStance: 'Exit risk',
  },
};

export function botPersonality(id: BotPersonalityId): BotPersonalityProfile {
  return BOT_PERSONALITY[id];
}

/** Cross-agent “what each would lean toward” for trust / comparison UI. */
export function botPersonalityConsensusRows(): { name: string; stance: string }[] {
  return [
    { name: 'Kai', stance: BOT_PERSONALITY.kai.comparisonStance },
    { name: 'Nova', stance: BOT_PERSONALITY.nova.comparisonStance },
    { name: 'Rio', stance: BOT_PERSONALITY.rio.comparisonStance },
  ];
}

export type BotAgent = {
  id: string;
  name: string;
  strategy: string;
  personalityId: BotPersonalityId;
  status: BotStatus;
  watchedPairs: string[];
  signalId: string;
  riskMode: 'balanced' | 'aggressive' | 'defensive';
  intentLine: string;
  activityLine: string;
  stats: BotRuntimeStats;
  detail: BotExpandDetail;
  /**
   * When true, expanded “current setup” shows the empty waiting state (scanning / no validated plan).
   * Seed: Nova demonstrates this while Kai/Rio show full setup grids.
   */
  expandedSetupPending?: boolean;
};

const BOT_TEMPLATES: Omit<BotAgent, 'stats' | 'detail' | 'signalId' | 'intentLine' | 'activityLine'>[] = [
  {
    id: 'bot-kai',
    name: 'Kai',
    strategy: 'Momentum Bot',
    personalityId: 'kai',
    status: 'scanning',
    watchedPairs: ['BTC', 'ETH', 'SOL'],
    riskMode: 'balanced',
  },
  {
    id: 'bot-nova',
    name: 'Nova',
    strategy: 'Breakout Bot',
    personalityId: 'nova',
    status: 'scanning',
    watchedPairs: ['BTC', 'AVAX', 'LINK'],
    riskMode: 'aggressive',
  },
  {
    id: 'bot-rio',
    name: 'Rio',
    strategy: 'Reversal Bot',
    personalityId: 'rio',
    status: 'scanning',
    watchedPairs: ['ETH', 'SOL', 'ADA'],
    riskMode: 'defensive',
  },
];

function buildBotDetail(signal: CryptoSignal | undefined): BotExpandDetail {
  if (!signal) {
    return {
      setupStateLabel: 'Awaiting setup',
      bias: 'Neutral',
      confidencePct: 0,
      setupType: 'Pullback',
      marketContext: { volatility: 'Medium', structure: 'Ranging', volume: 'Weak' },
      aiNote: 'Waiting for signals from the detection engine.',
    };
  }
  return {
    setupStateLabel: `${signal.setupType.charAt(0).toUpperCase() + signal.setupType.slice(1)} setup`,
    bias: signal.side === 'long' ? 'Long' : 'Short',
    confidencePct: Math.round(signal.confidence ?? signal.setupScore ?? 50),
    setupType: setupTypeFromSignal(signal.setupType),
    marketContext: {
      volatility: signal.marketState?.volatilityState === 'expanding' ? 'High' : 'Medium',
      structure: signal.marketState?.regime === 'trend' ? 'Trending' : 'Ranging',
      volume: signal.facts?.volumeRatio != null && signal.facts.volumeRatio > 1.5 ? 'Strong' : signal.facts?.volumeRatio != null && signal.facts.volumeRatio > 0.8 ? 'Building' : 'Weak',
    },
    aiNote: signal.aiExplanation || `${signal.pair} ${signal.setupType} signal — score ${signal.setupScore}`,
  };
}

export function deriveBotsFromSignals(signals: CryptoSignal[]): BotAgent[] {
  return BOT_TEMPLATES.map((tmpl) => {
    const matched = signals.filter((s) => {
      if (tmpl.id === 'bot-kai') return s.setupType === 'pullback';
      if (tmpl.id === 'bot-nova') return s.setupType === 'breakout';
      if (tmpl.id === 'bot-rio') return s.setupType === 'overextended';
      return false;
    });

    const signal = matched[0];
    const pairs = new Set<string>();
    for (const s of matched) {
      const base = s.pair.replace(/\/USDT$/i, '').replace(/USDT$/i, '');
      if (base) pairs.add(base);
    }
    const watchedPairs = pairs.size > 0 ? [...pairs].slice(0, 3) : tmpl.watchedPairs;

    return {
      ...tmpl,
      watchedPairs,
      signalId: signal?.id ?? '',
      status: matched.length > 0 ? 'active' : 'scanning',
      intentLine: signal
        ? `${signal.pair} ${signal.setupType} — score ${signal.setupScore}`
        : 'Waiting for live market data',
      activityLine: signal
        ? `${signal.pair} ${signal.side}`
        : 'Monitoring for setups',
      stats: {
        signalsToday: matched.length,
        winRatePct: 0,
        lastResultPct: 0,
      },
      detail: buildBotDetail(signal),
    };
  });
}

export const baseBots: BotAgent[] = [];

/** Map engine setup type to card label (overextended → Reversal). */
export function setupTypeFromSignal(setupType: CryptoSignal['setupType']): BotSetupTypeLabel {
  if (setupType === 'breakout') return 'Breakout';
  if (setupType === 'pullback') return 'Pullback';
  return 'Reversal';
}

export function statusTone(status: BotStatus): { label: string; className: string } {
  if (status === 'active') return { label: 'Active', className: 'text-[#7fffe0]' };
  if (status === 'scanning') return { label: 'Scanning', className: 'text-cyan-200' };
  return { label: 'Paused', className: 'text-slate-400' };
}

export function botCardStatusMeta(status: BotCardStatus): { label: string; dotClass: string; textClass: string } {
  switch (status) {
    case 'in_trade':
      return {
        label: 'In trade',
        dotClass: 'bg-[#00ffc8] shadow-[0_0_10px_rgba(0,255,200,0.55)]',
        textClass: 'text-[#7fffe0]',
      };
    case 'setup_forming':
      return {
        label: 'Setup forming',
        dotClass: 'bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.35)]',
        textClass: 'text-amber-200/95',
      };
    case 'scanning':
      return {
        label: 'Scanning',
        dotClass: 'bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.35)]',
        textClass: 'text-cyan-200',
      };
    case 'paused':
      return {
        label: 'Paused',
        dotClass: 'bg-slate-500',
        textClass: 'text-slate-400',
      };
    default:
      return {
        label: 'Active',
        dotClass: 'bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.3)]',
        textClass: 'text-emerald-200/95',
      };
  }
}

/**
 * Live card status: pause wins; then signal “triggered” → in trade; “setup” → setup_forming;
 * else fall back to stored bot mode (active / scanning).
 */
export function resolveBotCardStatus(stored: BotStatus, uiState: UiSignalState | null): BotCardStatus {
  if (stored === 'paused') return 'paused';
  if (uiState === 'triggered') return 'in_trade';
  if (uiState === 'setup_forming') return 'setup_forming';
  if (stored === 'scanning') return 'scanning';
  return 'active';
}

export function shortActionLabel(signal: CryptoSignal): string {
  const marketStatus = deriveMarketStatus(signal);
  const uiState = uiSignalStateFromMarketStatus(marketStatus);
  return `${signal.pair} ${uiSignalStateLabel(uiState).toLowerCase()}`;
}

export function formatBotPrice(n: number | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}
