import { describe, expect, it } from 'vitest';
import { DemoPositionRepository } from '@/services/positions/demoPositionRepository';
import {
  buildPaperMarkByPair,
  buildPaperMarkByPairFromSymbols,
} from '@/services/positions/positionRepository';

describe('buildPaperMarkByPairFromSymbols', () => {
  it('maps BTCUSDT ticker to paper position pair BTC / USDT', () => {
    const repo = new DemoPositionRepository([]);
    const open = repo.openPaperPosition({
      pair: 'BTC / USDT',
      market: 'futures',
      direction: 'long',
      entryPrice: 100_000,
      notionalUsd: 1_000,
      leverage: 10,
      source: 'demo',
    });
    expect(open.ok).toBe(true);

    const wrongKeyMarks = buildPaperMarkByPairFromSymbols({ BTC: { lastPrice: 101_000 } });
    const snapWrong = repo.getPaperTradingSnapshot(wrongKeyMarks);
    expect(snapWrong.unrealizedPnlUsd).toBe(0);

    const marks = buildPaperMarkByPairFromSymbols({ BTCUSDT: { lastPrice: 101_000 } });
    const snap = repo.getPaperTradingSnapshot(marks);
    expect(snap.unrealizedPnlUsd).toBeCloseTo(10, 4);
    expect(snap.equityUsd - snap.startingBalanceUsd).toBeCloseTo(10, 4);
  });

  it('falls back to mini-chart close when ticker key is missing', () => {
    const repo = new DemoPositionRepository([]);
    repo.openPaperPosition({
      pair: 'ETH / USDT',
      market: 'futures',
      direction: 'long',
      entryPrice: 3_000,
      notionalUsd: 600,
      leverage: 5,
      source: 'demo',
    });
    const marks = buildPaperMarkByPair(
      {},
      { positionPairKeys: ['ETHUSDT'], lastCloseByPairBase: { ETH: 3_100 } },
    );
    const snap = repo.getPaperTradingSnapshot(marks);
    expect(snap.unrealizedPnlUsd).toBeCloseTo(20, 4);
  });
});
