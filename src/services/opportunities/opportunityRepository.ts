import type { OpportunityCardModel } from '@/types/botSystem';

export type OpportunityRepositorySource = 'demo' | 'supabase';

export interface OpportunityRepository {
  readonly source: OpportunityRepositorySource;
  listOpportunities(): Promise<OpportunityCardModel[]>;
  getOpportunityById(id: string): Promise<OpportunityCardModel | undefined>;
}
