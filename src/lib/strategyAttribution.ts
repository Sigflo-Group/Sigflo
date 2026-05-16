import {
  STRATEGY_PERSONALITY_PROFILES,
  type StrategyPersonalityMode,
} from '@/lib/strategyPersonality';
import type { SignalLifecycleEvent } from '@/types/signal';

export const ATTRIBUTION_REGIMES = ['trend', 'range', 'volatile', 'compression'] as const;
export type AttributionRegime = (typeof ATTRIBUTION_REGIMES)[number];

export const STRATEGY_MODES_ORDERED = Object.keys(STRATEGY_PERSONALITY_PROFILES) as StrategyPersonalityMode[];

/** Minimum completed samples per matrix cell before showing rates. */
export const ATTRIBUTION_MIN_CELL_SAMPLES = 3;

export type AttributionCellMetrics = {
  winRate: number;
  averageConfidence: number;
  averageRR: number | null;
  sampleSize: number;
  stabilityScore: number;
  consistencyScore: number;
  signalEfficiency: number;
};

export type RegimeRanking = {
  regime: AttributionRegime;
  best: StrategyPersonalityMode | null;
  second: StrategyPersonalityMode | null;
  worst: StrategyPersonalityMode | null;
  bestWinRate: number;
  worstWinRate: number;
};

export type ModeDrawdownProfile = {
  mode: StrategyPersonalityMode;
  label: string;
  avgWinRate: number;
  minRegimeWinRate: number;
  maxRegimeWinRate: number;
  regimeSpread: number;
  drawdownSensitivityScore: number;
};

export type StrategyAttributionModel = {
  matrix: Record<StrategyPersonalityMode, Record<AttributionRegime, AttributionCellMetrics | null>>;
  rankingsByRegime: RegimeRanking[];
  modeDrawdown: ModeDrawdownProfile[];
  insights: string[];
  taggedSampleCount: number;
  legacyUntaggedCount: number;
  insufficientData: boolean;
};

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdSample(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const v = nums.reduce((s, x) => s + (x - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(v);
}

function rrAtCreation(event: SignalLifecycleEvent): number | null {
  const ep = event.entryContext.entryPrice;
  const risk = Math.abs(ep - event.invalidationLevel);
  const reward = Math.abs(event.targetLevel - ep);
  if (!(risk > 0) || !Number.isFinite(reward)) return null;
  return reward / risk;
}

export function isAttributionEligibleEvent(e: SignalLifecycleEvent): boolean {
  if (e.status !== 'completed' && e.status !== 'archived') return false;
  if (e.outcome !== 'win' && e.outcome !== 'loss' && e.outcome !== 'neutral') return false;
  const r = e.entryContext.marketRegime;
  if (!r || !ATTRIBUTION_REGIMES.includes(r as AttributionRegime)) return false;
  if (!e.strategyPersonalityMode) return false;
  return true;
}

function buildCell(events: SignalLifecycleEvent[]): AttributionCellMetrics | null {
  if (events.length < ATTRIBUTION_MIN_CELL_SAMPLES) return null;
  const wins = events.filter((e) => e.outcome === 'win').length;
  const winRate = wins / events.length;
  const avgConf = mean(events.map((e) => e.confidence));
  const rrVals = events.map(rrAtCreation).filter((x): x is number => x != null && Number.isFinite(x));
  const averageRR = rrVals.length ? mean(rrVals) : null;

  const qualities = events.map((e) => e.qualityScore).filter((q): q is number => q != null && Number.isFinite(q));
  const qStd = stdSample(qualities);
  const stabilityScore =
    qualities.length >= 2
      ? Math.max(0, Math.min(100, 100 - qStd * 1.2))
      : Math.min(100, 45 + events.length * 4);

  const mfes = events.map((e) => e.maxFavorableExcursion);
  const mfeStd = stdSample(mfes);
  const mfeMean = mean(mfes);
  const cov = mfeMean > 1e-6 ? mfeStd / mfeMean : mfeStd;
  const consistencyScore = Math.max(0, Math.min(100, 100 - cov * 35));

  const efficiencyHits = events.filter((e) => e.outcome === 'win' || e.maxFavorableExcursion >= 0.45).length;
  const signalEfficiency = efficiencyHits / events.length;

  return {
    winRate,
    averageConfidence: avgConf,
    averageRR,
    sampleSize: events.length,
    stabilityScore,
    consistencyScore,
    signalEfficiency,
  };
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function generateInsights(
  matrix: StrategyAttributionModel['matrix'],
  rankings: RegimeRanking[],
  modeDrawdown: ModeDrawdownProfile[],
): string[] {
  const out: string[] = [];
  const label = (m: StrategyPersonalityMode) => STRATEGY_PERSONALITY_PROFILES[m].label;

  for (const row of modeDrawdown) {
    const cells = ATTRIBUTION_REGIMES.map((r) => matrix[row.mode][r]).filter(Boolean).length;
    if (cells < 2) continue;
    if (row.regimeSpread < 0.12) {
      out.push(
        `${row.label} shows similar win rates across market conditions in this sample (spread ${(row.regimeSpread * 100).toFixed(0)} pts).`,
      );
    } else if (row.regimeSpread >= 0.28) {
      out.push(
        `${row.label} is sensitive to market conditions: about ${(row.regimeSpread * 100).toFixed(0)} points between its best and worst environments here.`,
      );
    }
  }

  const trendRank = rankings.find((r) => r.regime === 'trend');
  const rangeRank = rankings.find((r) => r.regime === 'range');
  if (
    trendRank?.best &&
    rangeRank?.worst &&
    trendRank.best === rangeRank.worst &&
    trendRank.bestWinRate - rangeRank.worstWinRate >= 0.15
  ) {
    out.push(
      `${label(trendRank.best)} ranks first in trending samples but last in range in this history — watch for chop.`,
    );
  }

  const agg: StrategyPersonalityMode = 'aggressive_momentum';
  const vol = matrix[agg]?.volatile;
  const rangeCell = matrix[agg]?.range;
  if (
    vol &&
    rangeCell &&
    vol.sampleSize >= ATTRIBUTION_MIN_CELL_SAMPLES &&
    rangeCell.sampleSize >= ATTRIBUTION_MIN_CELL_SAMPLES &&
    vol.winRate - rangeCell.winRate >= 0.2
  ) {
    out.push(
      `${label(agg)} shows a wide gap: fast-moving markets ${pct(vol.winRate)} vs choppy markets ${pct(rangeCell.winRate)} in recorded outcomes.`,
    );
  }

  const breakSpec: StrategyPersonalityMode = 'breakout_specialist';
  const comp = matrix[breakSpec]?.compression;
  const rangeC = matrix[breakSpec]?.range;
  if (
    comp &&
    rangeC &&
    comp.sampleSize >= ATTRIBUTION_MIN_CELL_SAMPLES &&
    rangeC.sampleSize >= ATTRIBUTION_MIN_CELL_SAMPLES &&
    comp.winRate >= rangeC.winRate + 0.12
  ) {
    out.push(
      `${label(breakSpec)} has tended to outperform more in quiet markets than in choppy markets in this dataset.`,
    );
  }

  const cons: StrategyPersonalityMode = 'conservative_structure';
  const consProf = modeDrawdown.find((d) => d.mode === cons);
  if (consProf && consProf.regimeSpread < 0.15 && consProf.avgWinRate > 0) {
    out.push(
      `${label(cons)} stays relatively steady across market conditions here — defensive posture with limited environment lottery.`,
    );
  }

  if (out.length === 0) {
    out.push(
      'Add more completed signals with stored personality and market-condition tags to unlock richer commentary.',
    );
  }

  return Array.from(new Set(out)).slice(0, 8);
}

/**
 * Read-only analytics: personality mode × market regime (from signal.marketState at emit) × lifecycle outcomes.
 */
export function buildStrategyAttributionModel(events: SignalLifecycleEvent[]): StrategyAttributionModel {
  const tagged = events.filter(isAttributionEligibleEvent);
  const completed = events.filter(
    (e) => (e.status === 'completed' || e.status === 'archived') && e.outcome != null,
  );
  const legacyUntagged = completed.filter((e) => !e.strategyPersonalityMode).length;

  const byCell: Record<string, SignalLifecycleEvent[]> = {};
  for (const e of tagged) {
    const m = e.strategyPersonalityMode!;
    const r = e.entryContext.marketRegime as AttributionRegime;
    const key = `${m}:${r}`;
    (byCell[key] ??= []).push(e);
  }

  const matrix = {} as StrategyAttributionModel['matrix'];
  for (const mode of STRATEGY_MODES_ORDERED) {
    matrix[mode] = {} as Record<AttributionRegime, AttributionCellMetrics | null>;
    for (const regime of ATTRIBUTION_REGIMES) {
      matrix[mode][regime] = buildCell(byCell[`${mode}:${regime}`] ?? []);
    }
  }

  const rankingsByRegime: RegimeRanking[] = ATTRIBUTION_REGIMES.map((regime) => {
    const rows: { mode: StrategyPersonalityMode; winRate: number }[] = [];
    for (const mode of STRATEGY_MODES_ORDERED) {
      const cell = matrix[mode][regime];
      if (cell && cell.sampleSize >= ATTRIBUTION_MIN_CELL_SAMPLES) {
        rows.push({ mode, winRate: cell.winRate });
      }
    }
    rows.sort((a, b) => b.winRate - a.winRate);
    return {
      regime,
      best: rows[0]?.mode ?? null,
      second: rows[1]?.mode ?? null,
      worst: rows.length ? rows[rows.length - 1]!.mode : null,
      bestWinRate: rows[0]?.winRate ?? 0,
      worstWinRate: rows.length ? rows[rows.length - 1]!.winRate : 0,
    };
  });

  const modeDrawdown: ModeDrawdownProfile[] = STRATEGY_MODES_ORDERED.map((mode) => {
    const rates: number[] = [];
    for (const regime of ATTRIBUTION_REGIMES) {
      const c = matrix[mode][regime];
      if (c && c.sampleSize >= ATTRIBUTION_MIN_CELL_SAMPLES) rates.push(c.winRate);
    }
    const avgWinRate = rates.length ? mean(rates) : 0;
    const minR = rates.length ? Math.min(...rates) : 0;
    const maxR = rates.length ? Math.max(...rates) : 0;
    const spread = maxR - minR;
    const drawdownSensitivityScore = Math.min(100, spread * 120);
    return {
      mode,
      label: STRATEGY_PERSONALITY_PROFILES[mode].label,
      avgWinRate,
      minRegimeWinRate: minR,
      maxRegimeWinRate: maxR,
      regimeSpread: spread,
      drawdownSensitivityScore,
    };
  });

  const insights = generateInsights(matrix, rankingsByRegime, modeDrawdown);

  return {
    matrix,
    rankingsByRegime,
    modeDrawdown,
    insights,
    taggedSampleCount: tagged.length,
    legacyUntaggedCount: legacyUntagged,
    insufficientData: tagged.length < 15,
  };
}

export function heatmapTone(winRate: number | null): string {
  if (winRate == null) return 'rgba(255,255,255,0.06)';
  const t = Math.max(0, Math.min(1, winRate));
  const r = Math.round(180 + 75 * (1 - t));
  const g = Math.round(60 + 140 * t);
  const b = Math.round(90 + 40 * t);
  return `rgba(${r},${g},${b},0.35)`;
}
