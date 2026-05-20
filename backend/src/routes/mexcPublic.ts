import { Router, type Request, type Response, type NextFunction } from 'express';
import { getJson } from '../exchanges/http.js';

const MEXC_CONTRACT_BASE = 'https://contract.mexc.com';

/** "SILVERUSDT" → "SILVER_USDT" */
function toMexcSymbol(sym: string): string {
  return sym.endsWith('USDT') ? sym.slice(0, -4) + '_USDT' : sym;
}

export const mexcPublicRouter = Router();

mexcPublicRouter.get('/klines/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.params['symbol'] ?? '';
    if (!/^[A-Z0-9_]{2,20}$/i.test(raw)) {
      res.status(400).json({ error: 'Invalid symbol' });
      return;
    }
    const mexcSymbol = toMexcSymbol(raw.toUpperCase());
    const interval = typeof req.query['interval'] === 'string' ? req.query['interval'] : 'Min15';
    const limit = typeof req.query['limit'] === 'string' ? req.query['limit'] : '140';
    const url = `${MEXC_CONTRACT_BASE}/api/v1/contract/kline/${encodeURIComponent(mexcSymbol)}?interval=${encodeURIComponent(interval)}&limit=${encodeURIComponent(limit)}`;
    const data = await getJson<unknown>(url, {});
    res.json(data);
  } catch (e) {
    next(e);
  }
});

mexcPublicRouter.get('/ticker/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.params['symbol'] ?? '';
    if (!/^[A-Z0-9_]{2,20}$/i.test(raw)) {
      res.status(400).json({ error: 'Invalid symbol' });
      return;
    }
    const mexcSymbol = toMexcSymbol(raw.toUpperCase());
    const url = `${MEXC_CONTRACT_BASE}/api/v1/contract/ticker?symbol=${encodeURIComponent(mexcSymbol)}`;
    const data = await getJson<unknown>(url, {});
    res.json(data);
  } catch (e) {
    next(e);
  }
});
