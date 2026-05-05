import { getOpportunities, getOpportunityById as getDemoOpportunityById } from '@/services/opportunityAdapter';
import type { OpportunityRepository } from '@/services/opportunities/opportunityRepository';

export const demoOpportunityRepository: OpportunityRepository = {
  source: 'demo',
  async listOpportunities() {
    return Promise.resolve(getOpportunities());
  },
  async getOpportunityById(id: string) {
    return Promise.resolve(getDemoOpportunityById(id));
  },
};
