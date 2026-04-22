import { useCallback, useState } from 'react';
import { executeTrade } from '@/lib/api/trade';
import type { TradeExecuteResponse } from '@/types/trade';

export function useExecuteTrade() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TradeExecuteResponse | null>(null);

  const execute = useCallback(async (executionToken: string, idempotencyKey: string) => {
    setPending(true);
    setError(null);
    try {
      const res = await executeTrade({ executionToken, idempotencyKey });
      setResult(res);
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order failed');
      throw e;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, result, execute };
}
