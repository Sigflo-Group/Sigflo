import type { SigfloActivePosition } from '@/types/position';
import { normalizePositionPairKey, type PositionRepository } from '@/services/positions/positionRepository';

export const DEMO_POSITIONS_CHANGED_EVENT = 'sigflo:demo-positions-changed';

export class DemoPositionRepository implements PositionRepository {
  private readonly byKey: Map<string, SigfloActivePosition>;

  constructor(rows: readonly SigfloActivePosition[] = []) {
    this.byKey = new Map(rows.map((r) => [normalizePositionPairKey(r.pair), r] as const));
  }

  getActivePositionByPair(pair: string): SigfloActivePosition | null {
    const key = normalizePositionPairKey(pair);
    return this.byKey.get(key) ?? null;
  }

  listActivePositions(): readonly SigfloActivePosition[] {
    return [...this.byKey.values()];
  }

  addPosition(position: SigfloActivePosition): void {
    const key = normalizePositionPairKey(position.pair);
    this.byKey.set(key, position);
    this.emitChanged();
  }

  closePositionByPair(pair: string): boolean {
    const key = normalizePositionPairKey(pair);
    const removed = this.byKey.delete(key);
    if (removed) this.emitChanged();
    return removed;
  }

  closeAllPositions(): number {
    const count = this.byKey.size;
    if (count === 0) return 0;
    this.byKey.clear();
    this.emitChanged();
    return count;
  }

  private emitChanged(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DEMO_POSITIONS_CHANGED_EVENT));
    }
  }
}
