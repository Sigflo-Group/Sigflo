import { DemoPositionRepository } from '@/services/positions/demoPositionRepository';
import type { PositionRepository } from '@/services/positions/positionRepository';

let singleton: PositionRepository | null = null;

export function getPositionRepository(): PositionRepository {
  if (!singleton) singleton = new DemoPositionRepository();
  return singleton;
}

export {
  buildPaperMarkByPairFromSymbols,
  normalizePositionPairKey,
  type PositionRepository,
} from '@/services/positions/positionRepository';
export { DemoPositionRepository } from '@/services/positions/demoPositionRepository';
export {
  sigfloActivePositionFromExchange,
  sigfloActiveToStripPosition,
  simulatedFromSigfloActive,
} from '@/services/positions/mappers';
