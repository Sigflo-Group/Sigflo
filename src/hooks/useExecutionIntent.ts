import { useCallback, useState } from 'react';
import { createTradeIntent } from '@/lib/api/trade';
import type { TradeExecutionIntentRequest, TradeExecutionIntentResponse } from '@/types/trade';

export function useExecutionIntent() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<TradeExecutionIntentResponse | null>(null);

  const requestIntent = useCallback(async (payload: TradeExecutionIntentRequest) => {
    setPending(true);
    setError(null);
    try {
      const res = await createTradeIntent(payload);
      setIntent(res);
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create trade intent');
      throw e;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, intent, requestIntent };
}
