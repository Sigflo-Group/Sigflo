import { log } from '../lib/logger.js';
import { upsertOpportunities, type UpsertOpportunityInput } from '../repositories/opportunitiesRepo.js';
import { createHash } from 'node:crypto';
import https from 'node:https';

const TRACKED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'LINKUSDT', 'PAXGUSDT', 'XAGUSDT'] as const;

type BybitTicker = { symbol: string; lastPrice: string; price24hPcnt: string };
type BybitKline = [string, string, string, string, string, string, string];

function stableUuidFromKey(key: string): string {
  const hex = createHash('sha1').update(key).digest('hex').slice(0, 32);
  const p1 = hex.slice(0, 8);
  const p2 = hex.slice(8, 12);
  const p3 = `4${hex.slice(13, 16)}`;
  const variantNibble = (parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8;
  const p4 = `${variantNibble.toString(16)}${hex.slice(17, 20)}`;
  const p5 = hex.slice(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

function insecureTlsEnabled(): boolean {
  const v = process.env.OPPORTUNITY_SYNC_INSECURE_TLS?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function errorWithCause(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) return `${error.message} (cause: ${cause.message})`;
  if (cause != null) return `${error.message} (cause: ${String(cause)})`;
  return error.message;
}

async function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        rejectUnauthorized: insecureTlsEnabled() ? false : true,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new Error(`HTTP ${status}${body ? ` - ${body.slice(0, 180)}` : ''}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function workerEnabled(): boolean {
  const v = process.env.OPPORTUNITY_SYNC_WORKER_ENABLED?.trim().toLowerCase();
  if (!v) return true;
  return v === '1' || v === 'true' || v === 'yes';
}

function workerIntervalMs(): number {
  const n = Number(process.env.OPPORTUNITY_SYNC_WORKER_INTERVAL_MS ?? '60000');
  return Number.isFinite(n) && n >= 15000 ? n : 60000;
}

function ema(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let out = values[0] ?? 0;
  for (let i = 1; i < values.length; i += 1) out = values[i]! * k + out * (1 - k);
  return out;
}

function rsi(values: number[], period: number): number {
  if (values.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const d = values[i]! - values[i - 1]!;
    if (d >= 0) gains += d;
    else losses += Math.abs(d);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

async function fetchTicker(symbol: string): Promise<BybitTicker | null> {
  const json = (await fetchJson(
    `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`,
  )) as { result?: { list?: BybitTicker[] } };
  return json.result?.list?.[0] ?? null;
}

async function fetchCloses(symbol: string): Promise<number[]> {
  const json = (await fetchJson(
    `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=15&limit=120`,
  )) as { result?: { list?: BybitKline[] } };
  const list = json.result?.list ?? [];
  return list
    .map((k) => Number(k[4]))
    .filter((n) => Number.isFinite(n) && n > 0)
    .reverse();
}

function buildOpportunity(symbol: string, ticker: BybitTicker, closes: number[]): UpsertOpportunityInput | null {
  if (closes.length < 60) return null;
  const pair = symbol.replace(/USDT$/i, '');
  const last = Number(ticker.lastPrice);
  const move24h = Number(ticker.price24hPcnt) * 100;
  if (!Number.isFinite(last) || last <= 0 || !Number.isFinite(move24h)) return null;

  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const r = rsi(closes, 14);
  const trendUp = e20 > e50;
  const trendDown = e20 < e50;
  const scoreBase = Math.min(100, Math.round(Math.abs(move24h) * 1.6 + Math.abs(r - 50) * 1.1 + (trendUp || trendDown ? 18 : 10)));
  const score = Math.max(35, scoreBase);

  const setupType = score >= 78 ? 'breakout' : score >= 62 ? 'pullback' : 'breakout';
  const status: UpsertOpportunityInput['status'] =
    score >= 92 ? 'triggered' : score >= 82 ? 'ready' : score >= 62 ? 'building' : 'watching';
  const direction: 'long' | 'short' = trendDown || move24h < -1 ? 'short' : 'long';
  const riskLabel: 'low' | 'medium' | 'high' = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

  const atrProxy = Math.max(last * 0.008, 0.0001);
  const entryLo = direction === 'long' ? last - atrProxy * 0.35 : last + atrProxy * 0.1;
  const entryHi = direction === 'long' ? last + atrProxy * 0.1 : last + atrProxy * 0.35;
  const stop = direction === 'long' ? last - atrProxy * 1.1 : last + atrProxy * 1.1;
  const t1 = direction === 'long' ? last + atrProxy * 1.4 : last - atrProxy * 1.4;
  const t2 = direction === 'long' ? last + atrProxy * 2.2 : last - atrProxy * 2.2;

  return {
    id: stableUuidFromKey(`sigflo-live-${symbol}`),
    pair,
    direction,
    setupType,
    strategyType: 'scanner_live',
    sourceEngine: 'bybit_live_scanner',
    status,
    score,
    thesis:
      direction === 'long'
        ? `${pair} structure is constructive with momentum bias to continuation.`
        : `${pair} structure is weakening with momentum bias to downside continuation.`,
    rationale: `15m scanner: EMA20 ${trendUp ? '>' : trendDown ? '<' : '~'} EMA50, RSI ${r.toFixed(1)}, 24h ${move24h >= 0 ? '+' : ''}${move24h.toFixed(2)}%.`,
    entryZone: `${entryLo.toFixed(4)} - ${entryHi.toFixed(4)}`,
    invalidation: stop.toFixed(4),
    targets: [t1.toFixed(4), t2.toFixed(4)],
    timeframeAlignment: ['15m live scanner'],
    freshnessSec: 0,
    riskLabel,
    isDemo: false,
  };
}

export async function runOpportunitySyncTick(): Promise<void> {
  const out: UpsertOpportunityInput[] = [];
  for (const symbol of TRACKED_SYMBOLS) {
    try {
      const [ticker, closes] = await Promise.all([fetchTicker(symbol), fetchCloses(symbol)]);
      if (!ticker) continue;
      const row = buildOpportunity(symbol, ticker, closes);
      if (row) out.push(row);
    } catch (e) {
      log('warn', 'Opportunity sync symbol failed.', { symbol, error: errorWithCause(e) });
    }
  }
  if (out.length === 0) {
    log('warn', 'Opportunity sync tick: no rows to upsert (all symbols failed or returned no data).');
    return;
  }
  try {
    await upsertOpportunities(out);
  } catch (e) {
    log('error', 'Opportunity sync DB upsert failed — opportunities not updated this tick.', {
      error: errorWithCause(e),
      symbolsAttempted: out.map((r) => r.pair),
    });
    return;
  }
  const statusCounts = out.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  log('info', 'Opportunity sync tick complete.', { rowsUpserted: out.length, statusCounts });
}

export function startOpportunitySyncWorker(): void {
  if (!workerEnabled()) return;
  const intervalMs = workerIntervalMs();
  log('info', 'Opportunity sync worker enabled.', { intervalMs });

  let ticking = false;
  const tick = async () => {
    if (ticking) return;
    ticking = true;
    try {
      await runOpportunitySyncTick();
    } catch (e) {
      log('error', 'Opportunity sync tick failed.', { error: String(e) });
    } finally {
      ticking = false;
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), intervalMs);
  process.once('SIGTERM', () => clearInterval(handle));
  process.once('SIGINT', () => clearInterval(handle));
}
