import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { createSupabaseOpportunityRepository } from '@/services/opportunities/supabaseOpportunityRepository';
import type { OpportunityRepository } from '@/services/opportunities/opportunityRepository';
import type { OpportunityCardModel } from '@/types/botSystem';

let cachedRepository: OpportunityRepository | null = null;

const liveOnlyRepository: OpportunityRepository = {
  source: 'supabase',
  async listOpportunities() {
    throw new Error('Live opportunities unavailable: Supabase is not configured.');
  },
  async getOpportunityById() {
    return undefined;
  },
};

export function getOpportunityRepository(): OpportunityRepository {
  if (!cachedRepository) {
    cachedRepository = isSupabaseConfigured() && supabase ? createSupabaseOpportunityRepository(supabase) : liveOnlyRepository;
  }
  return cachedRepository;
}

export async function listOpportunities(): Promise<OpportunityCardModel[]> {
  return getOpportunityRepository().listOpportunities();
}

export async function getOpportunityById(id: string): Promise<OpportunityCardModel | undefined> {
  return getOpportunityRepository().getOpportunityById(id);
}

export type { OpportunityRepository, OpportunityRepositorySource } from '@/services/opportunities/opportunityRepository';
