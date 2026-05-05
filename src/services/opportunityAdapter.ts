import { mockMarketSnapshots } from '@/services/engine/mockMarketSnapshots';
import {
  runBreakoutDetector,
  runMomentumDetector,
  runReversalDetector,
  runTrendPullbackDetector,
} from '@/services/engine/mockDetectors';
import { normalizeDetectorOutput } from '@/services/engine/opportunityNormalizer';
import { applyOpportunityConfidenceDecay } from '@/lib/opportunityConfidenceDecay';
import type { DetectorOutput } from '@/types/engine';
import type { OpportunityCardModel, OpportunityState } from '@/types/botSystem';

const DETECTORS = [
  runBreakoutDetector,
  runReversalDetector,
  runMomentumDetector,
  runTrendPullbackDetector,
] as const;

/** Priority order for the demo engine output list (then score descending). */
const ENGINE_STATE_SORT_RANK: Record<OpportunityState, number> = {
  Triggered: 0,
  Ready: 1,
  Managing: 2,
  Building: 3,
  Watching: 4,
  CoolingOff: 5,
  Invalidated: 6,
  Completed: 7,
};

function sortEngineOpportunities(list: OpportunityCardModel[]): OpportunityCardModel[] {
  return [...list].sort((a, b) => {
    const ra = ENGINE_STATE_SORT_RANK[a.state] ?? 99;
    const rb = ENGINE_STATE_SORT_RANK[b.state] ?? 99;
    if (ra !== rb) return ra - rb;
    if (b.score !== a.score) return b.score - a.score;
    return a.freshnessSec - b.freshnessSec;
  });
}

function pairKey(pair: string): string {
  return pair.replace(/[/\s]/g, '').toUpperCase();
}

/** One opportunity per underlying pair — keep highest score to avoid detector spam. */
function dedupeByPairBestScore(outputs: DetectorOutput[]): DetectorOutput[] {
  const best = new Map<string, DetectorOutput>();
  for (const o of outputs) {
    const k = pairKey(o.pair);
    const prev = best.get(k);
    if (!prev || o.score > prev.score) best.set(k, o);
  }
  return [...best.values()];
}

function buildOpportunitiesFromEngine(): OpportunityCardModel[] {
  const detectorOutputs: DetectorOutput[] = [];

  for (const snapshot of mockMarketSnapshots) {
    for (const run of DETECTORS) {
      const out = run(snapshot);
      if (out) detectorOutputs.push(out);
    }
  }

  const deduped = dedupeByPairBestScore(detectorOutputs);

  if (import.meta.env.DEV) {
    console.debug(
      '[Sigflo engine]',
      `snapshots=${mockMarketSnapshots.length}`,
      `detectorOutputs=${detectorOutputs.length}`,
      `opportunities=${deduped.length}`,
    );
  }

  return sortEngineOpportunities(
    deduped.map((out) => applyOpportunityConfidenceDecay(normalizeDetectorOutput(out))),
  );
}

let cachedOpportunities: OpportunityCardModel[] | null = null;

export function getOpportunities(): OpportunityCardModel[] {
  if (!cachedOpportunities) cachedOpportunities = buildOpportunitiesFromEngine();
  return cachedOpportunities;
}

export function getOpportunityById(id: string): OpportunityCardModel | undefined {
  const key = id.trim();
  if (!key) return undefined;
  return getOpportunities().find((o) => o.id === key);
}
