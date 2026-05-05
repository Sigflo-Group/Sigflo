import { MOCK_SIGFLO_POSITIONS } from '@/data/mockPositions';
import type { SigfloActivePosition } from '@/types/position';
import { normalizePositionPairKey, type PositionRepository } from '@/services/positions/positionRepository';

export class DemoPositionRepository implements PositionRepository {
  private readonly byKey: Map<string, SigfloActivePosition>;

  constructor(rows: readonly SigfloActivePosition[] = MOCK_SIGFLO_POSITIONS) {
    this.byKey = new Map(rows.map((r) => [normalizePositionPairKey(r.pair), r] as const));
  }

  getActivePositionByPair(pair: string): SigfloActivePosition | null {
    const key = normalizePositionPairKey(pair);
    return this.byKey.get(key) ?? null;
  }

  listActivePositions(): readonly SigfloActivePosition[] {
    return [...this.byKey.values()];
  }
}
