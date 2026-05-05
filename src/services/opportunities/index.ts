import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { demoOpportunityRepository } from '@/services/opportunities/demoOpportunityRepository';
import { createSupabaseOpportunityRepository } from '@/services/opportunities/supabaseOpportunityRepository';
import type { OpportunityRepository } from '@/services/opportunities/opportunityRepository';
import type { OpportunityCardModel } from '@/types/botSystem';

let cachedRepository: OpportunityRepository | null = null;

export function getOpportunityRepository(): OpportunityRepository {
  if (!cachedRepository) {
    cachedRepository =
      isSupabaseConfigured() && supabase
        ? createSupabaseOpportunityRepository(supabase)
        : demoOpportunityRepository;
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
