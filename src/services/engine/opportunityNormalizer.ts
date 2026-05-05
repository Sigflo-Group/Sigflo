import type { OpportunityCardModel, OpportunityState } from '@/types/botSystem';
import type { DetectorOutput } from '@/types/engine';

export function entryStatusFromOpportunityState(state: OpportunityState): string {
  switch (state) {
    case 'Triggered':
      return 'Trigger conditions met — review levels';
    case 'Ready':
      return 'Setup staged — review before any action';
    case 'Managing':
      return 'Workflow active — monitor plan vs market';
    case 'Building':
      return 'Structure building — wait for confirmation';
    case 'Watching':
      return 'Monitoring — no entry trigger yet';
    case 'CoolingOff':
      return 'Cooling off after recent activity';
    case 'Completed':
      return 'Scenario closed — archived context';
    case 'Invalidated':
      return 'Plan no longer valid at current prices';
    default:
      return 'Review context';
  }
}

export function normalizeDetectorOutput(output: DetectorOutput): OpportunityCardModel {
  const rationale =
    output.riskLabel === 'High'
      ? `${output.rationale} Higher-risk posture — wait for confirmation before acting.`
      : output.rationale;

  return {
    id: output.id,
    pair: output.pair,
    direction: output.direction,
    setupType: output.setupType,
    score: output.score,
    state: output.state,
    thesis: output.thesis,
    rationale,
    entryStatus: entryStatusFromOpportunityState(output.state),
    entryZone: output.entryZone,
    invalidation: output.invalidation,
    targets: output.targets,
    timeframeAlignment: output.timeframeAlignment,
    freshnessSec: output.freshnessSec,
  };
}
