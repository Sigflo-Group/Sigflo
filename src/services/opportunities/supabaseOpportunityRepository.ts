import type { SupabaseClient } from '@supabase/supabase-js';
import { applyOpportunityConfidenceDecay } from '@/lib/opportunityConfidenceDecay';
import { entryStatusFromOpportunityState } from '@/services/engine/opportunityNormalizer';
import type { OpportunityRepository } from '@/services/opportunities/opportunityRepository';
import type { Direction, OpportunityCardModel, OpportunityState } from '@/types/botSystem';
import type { OpportunityDbRow, OpportunityDbStatus } from '@/types/opportunityDb';
import { sortOpportunities } from '@/types/botSystem';

const DB_STATUS_TO_STATE: Record<OpportunityDbStatus, OpportunityState> = {
  watching: 'Watching',
  building: 'Building',
  ready: 'Ready',
  triggered: 'Triggered',
  managing: 'Managing',
  completed: 'Completed',
  invalidated: 'Invalidated',
  cooling_off: 'CoolingOff',
};

function mapRowToCard(row: OpportunityDbRow): OpportunityCardModel | null {
  const state = DB_STATUS_TO_STATE[row.status];
  if (!state) return null;
  const direction: Direction = row.direction === 'short' ? 'SHORT' : 'LONG';
  return {
    id: row.id,
    pair: row.pair,
    direction,
    setupType: row.setup_type,
    score: row.score,
    state,
    thesis: row.thesis,
    rationale: row.rationale,
    entryStatus: entryStatusFromOpportunityState(state),
    entryZone: row.entry_zone ?? undefined,
    invalidation: row.invalidation ?? undefined,
    targets: Array.isArray(row.targets) ? row.targets : [],
    timeframeAlignment: Array.isArray(row.timeframe_alignment) ? row.timeframe_alignment : [],
    freshnessSec: Number.isFinite(row.freshness_sec) ? row.freshness_sec : 0,
  };
}

export function createSupabaseOpportunityRepository(client: SupabaseClient): OpportunityRepository {
  return {
    source: 'supabase',
    async listOpportunities() {
      try {
        const { data, error } = await client.from('opportunities').select('*');
        if (error) {
          console.warn('[opportunities] list failed:', error.message);
          return [];
        }
        const rows = (data ?? []) as unknown as OpportunityDbRow[];
        const cards: OpportunityCardModel[] = [];
        for (const raw of rows) {
          const card = mapRowToCard(raw);
          if (card) cards.push(applyOpportunityConfidenceDecay(card));
        }
        return sortOpportunities(cards);
      } catch (e) {
        console.warn('[opportunities] list error:', e);
        return [];
      }
    },
    async getOpportunityById(id: string) {
      const key = id.trim();
      if (!key) return undefined;
      try {
        const { data, error } = await client.from('opportunities').select('*').eq('id', key).maybeSingle();
        if (error) {
          console.warn('[opportunities] get failed:', error.message);
          return undefined;
        }
        if (!data) return undefined;
        const card = mapRowToCard(data as unknown as OpportunityDbRow);
        return card ? applyOpportunityConfidenceDecay(card) : undefined;
      } catch (e) {
        console.warn('[opportunities] get error:', e);
        return undefined;
      }
    },
  };
}
