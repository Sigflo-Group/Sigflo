import { useEffect, useMemo, useState } from 'react';
import { getPositionRepository } from '@/services/positions';
import { DEMO_POSITIONS_CHANGED_EVENT, DemoPositionRepository, PAPER_TRADING_CHANGED_EVENT } from '@/services/positions/demoPositionRepository';

export function usePaperTrading(markByPair?: Record<string, number>) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const onChanged = () => setRevision((prev) => prev + 1);
    window.addEventListener(DEMO_POSITIONS_CHANGED_EVENT, onChanged);
    window.addEventListener(PAPER_TRADING_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(DEMO_POSITIONS_CHANGED_EVENT, onChanged);
      window.removeEventListener(PAPER_TRADING_CHANGED_EVENT, onChanged);
    };
  }, []);

  return useMemo(() => {
    void revision;
    const repo = getPositionRepository();
    if (!(repo instanceof DemoPositionRepository)) return null;
    return repo.getPaperTradingSnapshot(markByPair);
  }, [markByPair, revision]);
}
