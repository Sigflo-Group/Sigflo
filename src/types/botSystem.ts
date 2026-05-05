export type Direction = 'LONG' | 'SHORT';

export type OpportunityState =
  | 'Watching'
  | 'Building'
  | 'Ready'
  | 'Triggered'
  | 'Managing'
  | 'Completed'
  | 'Invalidated'
  | 'CoolingOff';

export type EngineState =
  | 'Enabled'
  | 'Paused'
  | 'RiskLimited'
  | 'ConnectionIssue'
  | 'CoolingOff'
  | 'ManagingTrade';

export type AutomationMode = 'Manual' | 'Assisted' | 'Auto';

export type RiskMode = 'Defensive' | 'Balanced' | 'Aggressive';

export type OpportunityCardModel = {
  id: string;
  pair: string;
  direction: Direction;
  setupType: string;
  score: number;
  state: OpportunityState;
  thesis: string;
  rationale: string;
  entryStatus: string;
  entryZone?: string;
  invalidation?: string;
  targets?: string[];
  timeframeAlignment?: string[];
  freshnessSec: number;
};

export type EngineStatusModel = {
  engineId: string;
  engineName: string;
  strategyType: string;
  mode: RiskMode;
  pairsWatched: number;
  state: EngineState;
  liveCandidates: number;
  activePositions: number;
  latestOutput: string;
  health: 'Healthy' | 'Degraded' | 'Offline';
};

export type SystemEventModel = {
  id: string;
  timestamp: string;
  eventType:
    | 'setup_upgraded'
    | 'setup_invalidated'
    | 'trade_managed'
    | 'risk_limit'
    | 'connection'
    | 'engine';
  severity: 'info' | 'success' | 'warning' | 'danger';
  message: string;
  relatedPair?: string;
  /** When set, event is scoped to an engine detail view (mock / future API). */
  relatedEngineId?: string;
};

export type CommandBarModel = {
  automationMode: AutomationMode;
  riskMode: RiskMode;
  /** Short status from Risk controls, e.g. "Live locked" or "Live ready". */
  liveExecutionLine?: string;
  /** Daily risk guard summary, e.g. "Risk guard normal". */
  riskGuardLine?: string;
  exchange: string;
  capitalDeployedPct: number;
  systemHealth: 'Healthy' | 'Degraded' | 'Offline';
};

export function getScoreTier(score: number): 'Elite' | 'Strong' | 'Valid' | 'Developing' | 'Hidden' {
  if (score >= 85) return 'Elite';
  if (score >= 75) return 'Strong';
  if (score >= 65) return 'Valid';
  if (score >= 55) return 'Developing';
  return 'Hidden';
}

export function formatFreshness(seconds: number): string {
  if (seconds < 60) return `Updated ${Math.max(1, Math.round(seconds))}s ago`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `Updated ${min}m ago`;
  const hr = Math.round(min / 60);
  return `Updated ${hr}h ago`;
}

const STATE_ORDER: Record<OpportunityState, number> = {
  Triggered: 0,
  Ready: 1,
  Managing: 2,
  Building: 3,
  Watching: 4,
  CoolingOff: 5,
  Invalidated: 6,
  Completed: 7,
};

export function sortOpportunities(opportunities: OpportunityCardModel[]): OpportunityCardModel[] {
  return [...opportunities].sort((a, b) => {
    const rankDiff = (STATE_ORDER[a.state] ?? 99) - (STATE_ORDER[b.state] ?? 99);
    if (rankDiff !== 0) return rankDiff;
    if (b.score !== a.score) return b.score - a.score;
    return a.freshnessSec - b.freshnessSec;
  });
}

export function getStateStyles(state: OpportunityState): { pill: string; dot: string } {
  switch (state) {
    case 'Triggered':
    case 'Ready':
      return {
        pill: 'border-emerald-300/35 bg-emerald-500/12 text-emerald-200',
        dot: 'bg-[#00ffc8] animate-pulse',
      };
    case 'Managing':
      return {
        pill: 'border-cyan-300/35 bg-cyan-500/12 text-cyan-200',
        dot: 'bg-cyan-300',
      };
    case 'Building':
    case 'Watching':
      return {
        pill: 'border-white/15 bg-white/[0.05] text-zinc-300',
        dot: 'bg-zinc-400',
      };
    case 'CoolingOff':
      return {
        pill: 'border-amber-300/35 bg-amber-500/10 text-amber-200',
        dot: 'bg-amber-300',
      };
    case 'Completed':
      return {
        pill: 'border-emerald-300/25 bg-emerald-500/8 text-emerald-200/85',
        dot: 'bg-emerald-300/80',
      };
    case 'Invalidated':
      return {
        pill: 'border-rose-300/30 bg-rose-500/10 text-rose-200',
        dot: 'bg-rose-300',
      };
    default:
      return { pill: 'border-white/10 bg-white/[0.04] text-zinc-300', dot: 'bg-zinc-400' };
  }
}
