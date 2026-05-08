import type { OpportunityCardModel } from '@/types/botSystem';

export function parseSourceEngineFromOpportunityId(id: string): string | undefined {
  const lower = id.trim().toLowerCase();
  if (lower.endsWith('-nova')) return 'Nova';
  if (lower.endsWith('-rio')) return 'Rio';
  if (lower.endsWith('-pulse')) return 'Pulse';
  if (lower.endsWith('-guard')) return 'Guard';
  return undefined;
}

export function deriveRiskLabelForReview(opp: Pick<OpportunityCardModel, 'setupType' | 'score'>): 'Low' | 'Medium' | 'High' {
  if (/reversal/i.test(opp.setupType)) return 'High';
  if (opp.score < 68) return 'High';
  if (opp.score >= 80) return 'Low';
  return 'Medium';
}

export function buildReasoningTimelineItems(opp: OpportunityCardModel | null, hasFullContext: boolean): string[] {
  if (!hasFullContext || !opp) {
    return [
      'Setup context unavailable',
      'Pair loaded from route, but full engine context was not found.',
      'Awaiting user review',
    ];
  }
  return [
    'Setup detected',
    Number.isFinite(opp.score) ? `Score calculated (${opp.score})` : 'Score calculated',
    opp.entryZone?.trim() ? 'Entry zone mapped' : 'Entry zone pending chart confirmation',
    opp.invalidation?.trim() ? 'Invalidation defined' : 'Invalidation pending confirmation',
    'Awaiting user review',
  ];
}
