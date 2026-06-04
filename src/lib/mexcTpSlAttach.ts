import { linearQtyFromBaseAmount } from '@/lib/linearOrderQty';
import type { LinearTpSlStrings } from '@/lib/bybitLinearTpSl';
import type { TradeSide } from '@/types/trade';

export type MexcPositionLeg = { size: number };

export function findMexcOpenLeg(
  positions: Array<{ symbol: string; side: string; size: number }> | undefined,
  symbol: string,
  side: TradeSide,
): MexcPositionLeg | null {
  if (!positions?.length) return null;
  const leg = positions.find((p) => p.symbol === symbol && p.size > 0 && p.side === side);
  return leg ? { size: leg.size } : null;
}

export async function pollForMexcPositionLeg<T>(
  poll: () => Promise<T>,
  readLeg: (snapshot: T) => MexcPositionLeg | null,
  opts?: { deadlineMs?: number; intervalMs?: number },
): Promise<MexcPositionLeg | null> {
  const deadline = Date.now() + (opts?.deadlineMs ?? 8000);
  const interval = opts?.intervalMs ?? 250;
  let snap = await poll();
  let leg = readLeg(snap);
  while (!leg && Date.now() < deadline) {
    await new Promise<void>((r) => {
      globalThis.setTimeout(r, interval);
    });
    snap = await poll();
    leg = readLeg(snap);
  }
  return leg;
}

export type AttachMexcTpSlParams = {
  symbol: string;
  positionSide: TradeSide;
  fallbackQty: string;
  tpSl: LinearTpSlStrings;
  userRequiredStop: boolean;
  resolveQty: () => Promise<string>;
  placeTpSl: (body: {
    symbol: string;
    positionSide: 'long' | 'short';
    qty: string;
    takeProfit?: string;
    stopLoss?: string;
  }) => Promise<void>;
  rollbackEntry: () => Promise<void>;
  onErrorToast: (message: string) => void;
};

/** Place MEXC stop orders after entry with retries; roll back entry when a required SL cannot be set. */
export async function attachMexcTpSlAfterEntry(p: AttachMexcTpSlParams): Promise<boolean> {
  if (!p.tpSl.takeProfit && !p.tpSl.stopLoss) return true;

  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      await new Promise<void>((r) => {
        globalThis.setTimeout(r, 400 * attempt);
      });
    }
    try {
      const qty = await p.resolveQty();
      await p.placeTpSl({
        symbol: p.symbol,
        positionSide: p.positionSide,
        qty,
        takeProfit: p.tpSl.takeProfit,
        stopLoss: p.tpSl.stopLoss,
      });
      return true;
    } catch (e) {
      lastErr = e;
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  if (p.userRequiredStop && p.tpSl.stopLoss) {
    try {
      await p.rollbackEntry();
      p.onErrorToast(
        `Stop-loss placement failed on MEXC. Entry was auto-closed.${msg ? ` ${msg}` : ''}`,
      );
    } catch (closeErr) {
      const closeMsg = closeErr instanceof Error ? closeErr.message : String(closeErr);
      p.onErrorToast(
        `Stop-loss placement failed and auto-close failed — close manually now. ${closeMsg}`,
      );
    }
    return false;
  }
  p.onErrorToast(`TP/SL sync on MEXC failed: ${msg}`);
  return false;
}

export function mexcQtyFromLeg(leg: MexcPositionLeg): string {
  return linearQtyFromBaseAmount(leg.size);
}
