export type OpportunityDbStatus =
  | 'watching'
  | 'building'
  | 'ready'
  | 'triggered'
  | 'managing'
  | 'completed'
  | 'invalidated'
  | 'cooling_off';

export type OpportunityDbRow = {
  id: string;
  pair: string;
  direction: 'long' | 'short';
  setup_type: string;
  strategy_type: string;
  source_engine: string;
  status: OpportunityDbStatus;
  score: number;
  thesis: string;
  rationale: string;
  entry_zone: string | null;
  invalidation: string | null;
  targets: string[];
  timeframe_alignment: string[];
  freshness_sec: number;
  risk_label: 'low' | 'medium' | 'high';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};
