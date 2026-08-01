import { Router, type Request, type Response, type NextFunction } from 'express';
import { getJson } from '../exchanges/http.js';

const MEXC_API_BASE = 'https://api.mexc.com';

/**
 * "SILVERUSDT" → "SILVER_USDT". Idempotent — the frontend client
 * (`src/services/mexc/publicClient.ts`) already converts the symbol to this
 * underscored format before building the request URL, so this route always
 * receives an already-converted symbol. Re-inserting a second underscore
 * ("SILVER__USDT") matches no real MEXC contract, silently breaking every
 * public kline/ticker fetch and falling back to synthetic placeholder data.
 */
export function toMexcSymbol(sym: string): string {
  if (sym.includes('_')) return sym;
  return sym.endsWith('USDT') ? sym.slice(0, -4) + '_USDT' : sym;
}

export const mexcPublicRouter = Router();

mexcPublicRouter.get('/klines/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = String(req.params['symbol'] ?? '');
    if (!/^[A-Z0-9_]{2,20}$/i.test(raw)) {
      res.status(400).json({ error: 'Invalid symbol' });
      return;
    }
    const mexcSymbol = toMexcSymbol(raw.toUpperCase());
    const interval = typeof req.query['interval'] === 'string' ? req.query['interval'] : 'Min15';
    const limit = typeof req.query['limit'] === 'string' ? req.query['limit'] : '140';
    const url = `${MEXC_API_BASE}/api/v1/contract/kline/${encodeURIComponent(mexcSymbol)}?interval=${encodeURIComponent(interval)}&limit=${encodeURIComponent(limit)}`;
    const data = await getJson<unknown>(url, {});
    res.json(data);
  } catch (e) {
    next(e);
  }
});

mexcPublicRouter.get('/tickers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const url = `${MEXC_API_BASE}/api/v1/contract/ticker`;
    const raw = await getJson<{ success: boolean; data: unknown }>(url, {});
    res.json({
      success: true,
      code: 0,
      data: raw && Array.isArray(raw.data) ? raw.data : raw?.data ? [raw.data] : [],
    });
  } catch (e) {
    next(e);
  }
});

mexcPublicRouter.get('/ticker/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = String(req.params['symbol'] ?? '');
    if (!/^[A-Z0-9_]{2,20}$/i.test(raw)) {
      res.status(400).json({ error: 'Invalid symbol' });
      return;
    }
    const mexcSymbol = toMexcSymbol(raw.toUpperCase());
    const url = `${MEXC_API_BASE}/api/v1/contract/ticker?symbol=${encodeURIComponent(mexcSymbol)}`;
    const data = await getJson<unknown>(url, {});
    res.json(data);
  } catch (e) {
    next(e);
  }
});
