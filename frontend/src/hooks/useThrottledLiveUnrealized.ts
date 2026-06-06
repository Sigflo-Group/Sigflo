import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import type { LiveTradeTickSnapshot } from '@/hooks/useLiveTradeMarket';
import type { SimulatedActivePosition } from '@/types/activePosition';
import { LIVE_MARKET_UI_THROTTLE_MS } from '@/lib/liveMarketTickConstants';

export type LiveUnrealizedBundle = {
  pnlUsd: number;
  movePct: number;
  /** Mark used for the last committed PnL (aligned with throttled tick ref). */
  mark: number;
};

function computeFromMark(pos: SimulatedActivePosition, mark: number): LiveUnrealizedBundle {
  const entry = Math.max(1e-9, pos.entryPrice);
  const dir = pos.side === 'long' ? 1 : -1;
  const movePct = ((mark - entry) / entry) * 100 * dir;
  const pnlUsd = pos.positionNotionalUsd * (movePct / 100);
  return { pnlUsd, movePct, mark };
}

function resolveLiveMark(
  lastPriceRef: MutableRefObject<number | undefined>,
  tickSnapshotRef?: MutableRefObject<LiveTradeTickSnapshot | null>,
): number | undefined {
  const snap = tickSnapshotRef?.current;
  if (snap?.markPrice != null && Number.isFinite(snap.markPrice) && snap.markPrice > 0) {
    return snap.markPrice;
  }
  const last = lastPriceRef.current;
  if (last != null && Number.isFinite(last) && last > 0) return last;
  if (snap?.lastPrice != null && Number.isFinite(snap.lastPrice) && snap.lastPrice > 0) {
    return snap.lastPrice;
  }
  return undefined;
}

/**
 * Reads live mark (futures mark price when available, else last) on a RAF loop and commits PnL
 * to React at {@link LIVE_MARKET_UI_THROTTLE_MS}. Keeps high-frequency ticks out of the render path.
 */
export function useThrottledLiveUnrealized(
  lastPriceRef: MutableRefObject<number | undefined>,
  position: SimulatedActivePosition | null,
  enabled: boolean,
  tickSnapshotRef?: MutableRefObject<LiveTradeTickSnapshot | null>,
): LiveUnrealizedBundle {
  const posRef = useRef(position);
  useLayoutEffect(() => {
    posRef.current = position;
  }, [position]);

  const [bundle, setBundle] = useState<LiveUnrealizedBundle>({ pnlUsd: 0, movePct: 0, mark: 0 });

  useEffect(() => {
    if (!enabled || !position) {
      setBundle({ pnlUsd: 0, movePct: 0, mark: 0 });
      return;
    }

    const mark0 = resolveLiveMark(lastPriceRef, tickSnapshotRef);
    if (mark0 != null) {
      setBundle(computeFromMark(position, mark0));
    }

    let raf = 0;
    let lastCommit = 0;

    const loop = () => {
      raf = window.requestAnimationFrame(loop);
      const pos = posRef.current;
      if (!pos) return;
      const now = performance.now();
      if (now - lastCommit < LIVE_MARKET_UI_THROTTLE_MS) return;
      const mark = resolveLiveMark(lastPriceRef, tickSnapshotRef);
      if (mark == null) return;
      const next = computeFromMark(pos, mark);
      lastCommit = now;
      setBundle((prev) =>
        Math.abs(prev.pnlUsd - next.pnlUsd) < 1e-8 &&
        Math.abs(prev.movePct - next.movePct) < 1e-5 &&
        prev.mark === next.mark
          ? prev
          : next,
      );
    };

    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [enabled, position, lastPriceRef, tickSnapshotRef]);

  return bundle;
}
