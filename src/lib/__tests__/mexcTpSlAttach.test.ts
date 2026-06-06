import { describe, expect, it, vi } from 'vitest';
import {
  attachMexcTpSlAfterEntry,
  findMexcOpenLeg,
  mexcQtyFromLeg,
} from '@/lib/mexcTpSlAttach';

describe('findMexcOpenLeg', () => {
  it('returns leg when symbol and side match', () => {
    const leg = findMexcOpenLeg(
      [{ symbol: 'BTCUSDT', side: 'long', size: 0.01 }],
      'BTCUSDT',
      'long',
    );
    expect(leg).toEqual({ size: 0.01 });
  });

  it('returns null when no open size', () => {
    expect(findMexcOpenLeg([{ symbol: 'BTCUSDT', side: 'long', size: 0 }], 'BTCUSDT', 'long')).toBeNull();
  });
});

describe('mexcQtyFromLeg', () => {
  it('formats base size for API', () => {
    expect(mexcQtyFromLeg({ size: 0.5 })).toBe('0.5');
  });
});

describe('attachMexcTpSlAfterEntry', () => {
  it('returns true when no TP/SL levels', async () => {
    const ok = await attachMexcTpSlAfterEntry({
      symbol: 'BTCUSDT',
      positionSide: 'long',
      fallbackQty: '0.01',
      tpSl: {},
      userRequiredStop: true,
      resolveQty: async () => '0.01',
      placeTpSl: async () => {},
      rollbackEntry: async () => {},
      onErrorToast: () => {},
    });
    expect(ok).toBe(true);
  });

  it('rolls back entry when required SL placement fails', async () => {
    const rollback = vi.fn();
    const onErrorToast = vi.fn();
    const ok = await attachMexcTpSlAfterEntry({
      symbol: 'BTCUSDT',
      positionSide: 'long',
      fallbackQty: '0.01',
      tpSl: { stopLoss: '90000' },
      userRequiredStop: true,
      closeEntryOnRequiredSlFailure: true,
      resolveQty: async () => '0.01',
      placeTpSl: async () => {
        throw new Error('rejected');
      },
      rollbackEntry: rollback,
      onErrorToast,
    });
    expect(ok).toBe(false);
    expect(rollback).toHaveBeenCalledOnce();
    expect(onErrorToast).toHaveBeenCalledOnce();
  });

  it('retries before failing', async () => {
    let attempts = 0;
    const ok = await attachMexcTpSlAfterEntry({
      symbol: 'BTCUSDT',
      positionSide: 'long',
      fallbackQty: '0.01',
      tpSl: { takeProfit: '100000' },
      userRequiredStop: false,
      resolveQty: async () => '0.01',
      placeTpSl: async () => {
        attempts += 1;
        if (attempts < 2) throw new Error('not ready');
      },
      rollbackEntry: async () => {},
      onErrorToast: () => {},
    });
    expect(ok).toBe(true);
    expect(attempts).toBe(2);
  });
});
