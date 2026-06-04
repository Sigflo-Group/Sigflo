import { useId, useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { feedActionablePath } from '@/config/appRoutes';
import { useAccountSnapshot } from '@/hooks/useAccountSnapshot';
import { useBotStatuses } from '@/hooks/useBotStatuses';
import { useBotUserConfig } from '@/hooks/useBotUserConfig';
import { useFeedMiniCharts } from '@/hooks/useFeedMiniCharts';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import type { TradeChartInterval } from '@/hooks/useLiveTradeMarket';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { getManualTrades } from '@/lib/tradeSourceFilter';
import { formatQuoteNumber } from '@/lib/formatQuote';
import {
  attributeBotNameForSymbol,
  buildBotDayStats,
  closedPnlAsEquityPct,
  closedTradesSinceUtc,
  utcDayStartMs,
} from '@/lib/portfolioBotAttribution';
import { derivePositionAiExitStatus, positionAiExitMeta } from '@/lib/portfolioPositionAi';
import { entryNotionalUsd, livePnlPercent } from '@/lib/positionRoe';
import { positionBiasForLinearSymbol } from '@/lib/positionBiasStat';
import { positionMicroInsight } from '@/lib/positionMicroInsight';
import { formatSignedPercent, formatSignedUsd } from '@/lib/signedPnl';
import { symbolToPair } from '@/lib/marketScannerRows';
import { buildPortfolioPositionTradeQuery } from '@/lib/tradeNavigation';
import { deriveBotsFromSignals } from '@/lib/bots';
import { BYBIT_APP_ASSETS_HOME_HREF } from '@/lib/exchangeTransferUrls';
import { buildPaperMarkByPairFromSymbols, normalizePositionPairKey } from '@/services/positions';
import type { ExchangeSnapshot, PositionItem } from '@/types/integrations';
import type { Candle } from '@/types/market';

const PORTFOLIO_MINI_INTERVAL: TradeChartInterval = '15';

const ACCENT = '#00C878';
const PAGE_BG = '#0F1115';
const SURFACE = '#171A20';

const STABLE_ASSETS = new Set(['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDE']);

function aggregateStablesAndPnl(snapshots: ExchangeSnapshot[]) {
  let unrealized = 0;
  let connected = false;
  for (const s of snapshots) {
    if (s.status !== 'connected') continue;
    connected = true;
    for (const p of s.positions) unrealized += p.unrealizedPnl ?? 0;
  }
  return { unrealized, connected };
}

function equityUsdForSnapshot(s: ExchangeSnapshot): number {
  if (s.status !== 'connected') return 0;
  const te = s.accountBreakdown?.overview?.totalEquity;
  if (te != null && Number.isFinite(te) && te > 0) return te;
  let st = 0;
  for (const b of s.balances) {
    if (STABLE_ASSETS.has(b.asset.toUpperCase())) st += b.total;
  }
  let up = 0;
  for (const p of s.positions) up += p.unrealizedPnl ?? 0;
  return Math.max(0, st + up);
}

function totalPortfolioEquityUsd(snapshots: ExchangeSnapshot[]): number {
  let sum = 0;
  for (const s of snapshots) sum += equityUsdForSnapshot(s);
  return sum;
}

function flattenPositions(snapshots: ExchangeSnapshot[]): Array<PositionItem & { exchange: string }> {
  const out: Array<PositionItem & { exchange: string }> = [];
  for (const s of snapshots) {
    if (s.status !== 'connected') continue;
    for (const p of s.positions) out.push({ ...p, exchange: s.exchange });
  }
  return out;
}

function positionNotionalUsd(p: PositionItem): number {
  return entryNotionalUsd({ size: p.size, entryPrice: p.entryPrice, markPrice: p.markPrice });
}

function formatUsd2(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pairLabel(symbol: string): string {
  if (symbol.endsWith('USDT')) return `${symbolToPair(symbol)} / USDT`;
  return symbol;
}

function candleCloses(candles: Candle[] | undefined): number[] {
  if (!candles?.length) return [];
  return candles.map((k) => k.close).filter((n) => Number.isFinite(n));
}

function sparkPositiveFromCloses(closes: number[]): boolean {
  if (closes.length < 2) return true;
  const a = closes[0]!;
  const b = closes[closes.length - 1]!;
  return b >= a;
}

function sparklinePath(values: number[], w: number, h: number): { line: string; area: string } {
  if (values.length < 2) return { line: '', area: '' };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h * 0.72) - h * 0.14;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return { line, area };
}

function buildSparklineSeries(netWorth: number, up: boolean): number[] {
  const n = 36;
  const out: number[] = [];
  let v = netWorth * (up ? 0.94 : 1.04);
  for (let i = 0; i < n; i++) {
    const pull = (netWorth - v) * 0.11;
    v += pull + Math.sin(i * 0.55) * netWorth * 0.0015;
    out.push(v);
  }
  out[n - 1] = netWorth;
  return out;
}

/** Synthetic mark path from entry → current for a position mini chart. */
function buildPositionMarkSeries(entryPrice: number, markPrice: number, points = 26): number[] {
  if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(markPrice) || markPrice <= 0) {
    return Array.from({ length: points }, (_, i) => 1 + i * 0.02);
  }
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const base = entryPrice + (markPrice - entryPrice) * t;
    const wobble = Math.sin(i * 0.75) * entryPrice * 0.0028;
    out.push(base + wobble);
  }
  out[points - 1] = markPrice;
  return out;
}

function MiniPortfolioSpark({
  series,
  positive,
  w = 124,
  h = 42,
  className = '',
}: {
  series: number[];
  positive: boolean;
  w?: number;
  h?: number;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `pf-ms-${uid}`;
  const stroke = positive ? ACCENT : '#f87171';
  const { line, area } = useMemo(() => sparklinePath(series, w, h), [series, w, h]);
  if (!line) return <div className={`shrink-0 ${className}`} style={{ width: w, height: h }} aria-hidden />;

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg bg-[#08090d] ring-1 ring-white/[0.05] ${className}`}
      style={{ width: w, height: h }}
      aria-hidden
    >
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block h-full w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {area ? <path d={area} fill={`url(#${gradId})`} /> : null}
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{children}</h2>
  );
}

function CardShell({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`landing-panel-texture rounded-2xl border border-white/[0.06] p-4 transition-shadow duration-300 ${className}`}
      style={{
        backgroundColor: SURFACE,
        boxShadow: glow
          ? `0 0 0 1px rgba(0,200,120,0.12), 0 12px 40px -16px rgba(0,200,120,0.18)`
          : '0 8px 32px -20px rgba(0,0,0,0.5)',
      }}
    >
      {children}
    </div>
  );
}

export default function PortfolioScreen() {
  const navigate = useNavigate();
  const { items: snapshots, closedTrades, loading } = useAccountSnapshot({ pollMs: 12_000 });
  const { liveTickersBySymbol, signals: scannerSignals } = useSignalEngine();
  const { mergeBot } = useBotUserConfig();
  const { statusMap } = useBotStatuses();

  const liveBots = useMemo(() => deriveBotsFromSignals(scannerSignals), [scannerSignals]);
  const mergedBots = useMemo(() => liveBots.map(mergeBot), [liveBots, mergeBot]);

  const { unrealized, connected } = useMemo(() => aggregateStablesAndPnl(snapshots), [snapshots]);
  const positions = useMemo(() => flattenPositions(snapshots), [snapshots]);

  const positionPairKeys = useMemo(
    () => [...new Set(positions.map((p) => symbolToPair(p.symbol).toUpperCase()))],
    [positions],
  );
  const botChartPairs = useMemo(
    () => mergedBots.map((b) => (b.watchedPairs[0] ?? 'BTC').toUpperCase()),
    [mergedBots],
  );
  const miniChartPairs = useMemo(
    () => [...new Set(['BTC', ...positionPairKeys, ...botChartPairs])],
    [positionPairKeys, botChartPairs],
  );
  const miniCandles = useFeedMiniCharts(miniChartPairs, {
    interval: PORTFOLIO_MINI_INTERVAL,
    fastPairs: positionPairKeys,
    refreshMs: 45_000,
    fastRefreshMs: 12_000,
  });
  const paperMarkByPair = useMemo(
    () => buildPaperMarkByPairFromSymbols(liveTickersBySymbol),
    [liveTickersBySymbol],
  );
  const paperSnapshot = usePaperTrading(paperMarkByPair);
  const paperPositions = paperSnapshot?.positions ?? [];
  const paperOrderRows = useMemo(() => (paperSnapshot?.orders ?? []).slice(0, 10), [paperSnapshot?.orders]);

  const netWorth = useMemo(
    () => (connected ? totalPortfolioEquityUsd(snapshots) : 0),
    [connected, snapshots],
  );

  const manualClosedTrades = useMemo(() => getManualTrades(closedTrades), [closedTrades]);

  const dayStartMs = useMemo(() => utcDayStartMs(), []);
  const closedToday = useMemo(
    () => closedTradesSinceUtc(manualClosedTrades, dayStartMs),
    [manualClosedTrades, dayStartMs],
  );
  const todayPnl = useMemo(
    () => (connected ? closedToday.reduce((s, t) => s + t.closedPnl, 0) : 0),
    [connected, closedToday],
  );
  const todayPct = useMemo(() => {
    if (!connected) return 0;
    const denom = Math.max(Math.abs(netWorth - todayPnl), Math.max(Math.abs(netWorth), 1));
    return (todayPnl / denom) * 100;
  }, [connected, netWorth, todayPnl]);

  const managingBotsCount = useMemo(() => {
    return liveBots.filter((b) => {
      const s = statusMap[b.id] ?? b.status;
      return s === 'active' || s === 'scanning';
    }).length;
  }, [statusMap, liveBots]);

  const botDayStats = useMemo(
    () => buildBotDayStats(mergedBots, closedTradesSinceUtc(closedTrades, dayStartMs)),
    [mergedBots, closedTrades, dayStartMs],
  );

  const overviewSparkSeries = useMemo(() => {
    // Prefer the first active position's price data — more relevant than a BTC proxy
    for (const pos of positions) {
      const key = symbolToPair(pos.symbol).toUpperCase();
      const closes = candleCloses(miniCandles[key]);
      if (closes.length >= 2) return closes;
    }
    const btc = candleCloses(miniCandles['BTC']);
    if (btc.length >= 2) return btc;
    const nw = connected ? netWorth : 2500;
    const up = connected ? todayPnl >= 0 : true;
    return buildSparklineSeries(Math.max(nw, 0.01), up);
  }, [miniCandles, positions, connected, netWorth, todayPnl]);
  const { line: sparkPath, area: sparkArea } = useMemo(
    () => sparklinePath(overviewSparkSeries, 320, 72),
    [overviewSparkSeries],
  );
  const overviewSparkStroke = useMemo(() => {
    if (overviewSparkSeries.length < 2) return ACCENT;
    return sparkPositiveFromCloses(overviewSparkSeries) ? ACCENT : '#fb7185';
  }, [overviewSparkSeries]);

  const historyRows = useMemo(() => {
    const sorted = [...manualClosedTrades].sort(
      (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(),
    );
    return sorted.slice(0, 10);
  }, [manualClosedTrades]);

  const realizedPnlByExchangeSymbol = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of manualClosedTrades) {
      const key = `${t.exchange}:${t.symbol}`;
      map.set(key, (map.get(key) ?? 0) + t.closedPnl);
    }
    return map;
  }, [manualClosedTrades]);

  const displayNet = connected
    ? netWorth
    : paperSnapshot?.equityUsd ?? paperSnapshot?.startingBalanceUsd ?? 10_000;
  const paperTotalPnlUsd = useMemo(() => {
    if (!paperSnapshot) return 0;
    return paperSnapshot.equityUsd - paperSnapshot.startingBalanceUsd;
  }, [paperSnapshot]);
  const displayPnl = connected ? todayPnl : paperTotalPnlUsd;
  const displayPnlPct = connected
    ? todayPct
    : paperSnapshot && paperSnapshot.startingBalanceUsd > 0
      ? (paperTotalPnlUsd / paperSnapshot.startingBalanceUsd) * 100
      : 0;
  const displayPnlLabel = connected ? 'today' : 'total';
  const activePositionCount = connected ? positions.length : paperPositions.length;

  return (
    <div
      className="min-h-[100dvh] scroll-smooth pb-28 pt-4"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="mx-auto w-full max-w-lg space-y-6 px-4">
        {/* 1. Overview */}
        <CardShell glow className="relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Total balance</p>
            {!connected ? (
              <span className="rounded-full border border-violet-400/25 bg-violet-500/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-violet-100">
                Paper Trading Mode
              </span>
            ) : null}
          </div>
          {loading && connected ? (
            <p className="mt-2 font-mono text-3xl font-bold text-white/40">…</p>
          ) : (
            <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-white">${formatUsd2(displayNet)}</p>
          )}

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p
              className={`text-lg font-bold tabular-nums ${displayPnl >= 0 ? '' : 'text-rose-300'}`}
              style={{ color: displayPnl >= 0 ? ACCENT : undefined }}
            >
              {formatSignedUsd(displayPnl)}
            </p>
            <p
              className={`text-sm font-semibold tabular-nums ${displayPnl >= 0 ? 'text-emerald-200/90' : 'text-rose-200/90'}`}
            >
              {formatSignedPercent(displayPnlPct, 1)} {displayPnlLabel}
            </p>
          </div>
          {!connected ? (
            <p className="mt-1 text-[11px] text-white/45">
              Simulated cash ${formatUsd2(paperSnapshot?.cashUsd ?? 10_000)} · Start exploring with virtual funds.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-white/45">Connected exchange equity and PnL are synced live.</p>
          )}

          <div className="mt-4 overflow-hidden rounded-xl bg-[#08090d] px-1 py-1 ring-1 ring-white/[0.04]">
            <svg viewBox="0 0 320 72" className="h-[72px] w-full" aria-hidden>
              <defs>
                <linearGradient id="pf-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={overviewSparkStroke} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={overviewSparkStroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              {sparkArea ? <path d={sparkArea} fill="url(#pf-spark)" /> : null}
              {sparkPath ? (
                <path
                  d={sparkPath}
                  fill="none"
                  stroke={overviewSparkStroke}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  className={
                    overviewSparkStroke === ACCENT
                      ? 'drop-shadow-[0_0_10px_rgba(0,200,120,0.35)]'
                      : 'drop-shadow-[0_0_10px_rgba(248,113,113,0.28)]'
                  }
                />
              ) : null}
            </svg>
          </div>

          <p className="mt-4 text-center text-[12px] font-medium text-white/55">
            {activePositionCount} active position{activePositionCount === 1 ? '' : 's'} · {managingBotsCount} bot
            {managingBotsCount === 1 ? '' : 's'} managing trades
          </p>
          {!connected ? (
            <p className="mt-2 text-center text-[11px] text-white/40">
              You can keep trading in paper mode, or connect an exchange anytime from Account.
            </p>
          ) : null}
        </CardShell>

        {/* 2. Active positions */}
        <section className="space-y-3">
          <SectionTitle>Active positions</SectionTitle>
          {!connected && paperPositions.length === 0 ? (
            <CardShell>
              <p className="text-sm text-white/55">
                No simulated positions yet. Open a paper trade from Trade or Bots to start tracking performance.
              </p>
            </CardShell>
          ) : null}
          {!connected && paperPositions.length > 0 ? (
            <div className="space-y-3">
              {paperPositions.map((position) => {
                const up = position.unrealizedPnl >= 0;
                const pairKey = normalizePositionPairKey(position.pair);
                const pairLabelText = pairKey.endsWith('USDT')
                  ? `${pairKey.slice(0, -4)} / USDT`
                  : pairKey.endsWith('USDC')
                    ? `${pairKey.slice(0, -4)} / USDC`
                    : position.pair;
                return (
                  <CardShell key={position.id} className={`!p-3 border-white/[0.07] ${up ? 'ring-1 ring-violet-300/15' : 'ring-1 ring-rose-500/10'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold tracking-tight text-white">{pairLabelText}</p>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200/80">Simulated position</p>
                        <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${up ? 'text-violet-100' : 'text-rose-300'}`}>
                          {formatSignedUsd(position.unrealizedPnl)}
                        </p>
                        <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${up ? 'text-violet-200/80' : 'text-rose-200/90'}`}>
                          {formatSignedPercent(position.unrealizedPnlPct, 1)} unrealized
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {formatQuoteNumber(position.entryPrice)} → {formatQuoteNumber(position.markPrice)}
                        </p>
                      </div>
                      <span className="rounded-md border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-100">
                        PAPER
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/trade?pair=${encodeURIComponent(pairKey)}&source=position`)}
                      className="mt-3 w-full rounded-xl border border-white/[0.12] bg-white/[0.04] py-2 text-[11px] font-bold text-white transition hover:bg-white/[0.07]"
                    >
                      Manage in Trade
                    </button>
                  </CardShell>
                );
              })}
            </div>
          ) : null}
          {connected && loading ? <p className="text-sm text-white/45">Syncing positions…</p> : null}
          {connected && !loading && positions.length === 0 ? (
            <CardShell>
              <p className="text-base font-semibold text-white">Flat book</p>
              <p className="mt-1 text-sm text-white/50">No open risk — scan Feed when you are ready.</p>
              <Link
                to={feedActionablePath()}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-[#0a1614]"
                style={{ backgroundColor: ACCENT, boxShadow: `0 0 24px -8px ${ACCENT}` }}
              >
                View setups
              </Link>
            </CardShell>
          ) : null}

          {connected && !loading && positions.length > 0 ? (
            <div className="space-y-4">
              {positions.map((p) => {
                const current = p.markPrice ?? p.entryPrice;
                const pnl = p.unrealizedPnl ?? 0;
                const pnlPct = livePnlPercent({
                  side: p.side,
                  unrealizedPnl: pnl,
                  size: p.size,
                  entryPrice: p.entryPrice,
                  markPrice: current,
                  leverage: p.leverage,
                  positionIM: p.positionIM,
                });
                const up = pnl >= 0;
                const realizedPnl = realizedPnlByExchangeSymbol.get(`${p.exchange}:${p.symbol}`) ?? 0;
                const realizedUp = realizedPnl >= 0;
                const ticker = liveTickersBySymbol[p.symbol];
                const insight = positionMicroInsight({ side: p.side }, current, pnlPct, ticker);
                const notional = positionNotionalUsd(p);
                const aiStatus = derivePositionAiExitStatus({
                  pnlPct,
                  unrealizedUsd: pnl,
                  position: p,
                });
                const aiMeta = positionAiExitMeta(aiStatus);
                const tradeExtras =
                  p.entryPrice > 0
                    ? {
                        positionUsd: Math.max(1, Math.round(notional)),
                        entryPrice: p.entryPrice,
                        posSize: p.size,
                        markPrice: current,
                        ...(p.leverage != null && p.leverage > 0 ? { leverage: p.leverage } : {}),
                      }
                    : undefined;
                const baseQuery = buildPortfolioPositionTradeQuery(p.symbol, p.side, tradeExtras);
                const adjustQuery = buildPortfolioPositionTradeQuery(p.symbol, p.side, {
                  ...tradeExtras,
                  focusAdjust: true,
                });
                const closeQuery = buildPortfolioPositionTradeQuery(p.symbol, p.side, {
                  ...tradeExtras,
                  ticketIntent: 'close',
                });

                const pairKey = symbolToPair(p.symbol).toUpperCase();
                const positionBiasStat = positionBiasForLinearSymbol(p.symbol, p.side, scannerSignals);
                const liveCloses = candleCloses(miniCandles[pairKey]);
                const hasLiveMini = liveCloses.length >= 2;
                const positionSparkSeries = hasLiveMini
                  ? liveCloses
                  : buildPositionMarkSeries(p.entryPrice, current);
                const positionSparkPositive = hasLiveMini
                  ? sparkPositiveFromCloses(liveCloses)
                  : up;

                return (
                  <CardShell
                    key={`${p.exchange}-${p.symbol}-${p.side}-${p.positionIdx ?? 0}`}
                    glow={up && pnlPct >= 0.5}
                    className={`!p-3 border-white/[0.07] ${up ? 'ring-1 ring-[#00C878]/15' : 'ring-1 ring-rose-500/10'}`}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/trade?${baseQuery}`)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold tracking-tight text-white">{pairLabel(p.symbol)}</p>
                          <p className="mt-0 text-[10px] font-medium uppercase tracking-wider text-white/35">
                            {p.exchange}
                          </p>
                          {notional >= 1 ? (
                            <p className="mt-1 text-[11px] text-white/50">
                              Size{' '}
                              <span className="font-semibold text-white/85">
                                ${Math.round(notional).toLocaleString('en-US')}
                              </span>
                            </p>
                          ) : null}
                          <div className="mt-1">
                            <p
                              className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${up ? '' : 'text-rose-300'}`}
                              style={{ color: up ? ACCENT : undefined }}
                            >
                              {formatSignedUsd(pnl)}
                            </p>
                            <p className={`mt-0.5 font-mono text-base font-semibold tabular-nums text-white/70`}>
                              {formatSignedPercent(pnlPct, 1)} live
                            </p>
                            <p
                              className={`mt-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                                realizedUp ? 'text-emerald-200/90' : 'text-rose-200/90'
                              }`}
                            >
                              {formatSignedUsd(realizedPnl)} realized
                            </p>
                          </div>
                          <p className="mt-1 text-[11px] text-white/45">
                            {formatQuoteNumber(p.entryPrice)} → {formatQuoteNumber(current)}
                          </p>
                        </div>
                        {positionBiasStat ? (
                          <div className="ml-auto flex w-fit max-w-[min(100%,15rem)] shrink-0 flex-col items-stretch gap-1.5 rounded-lg border border-white/[0.06] bg-black/25 px-2 py-1.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <MiniPortfolioSpark
                                series={positionSparkSeries}
                                positive={positionSparkPositive}
                                w={120}
                                h={40}
                              />
                              <span
                                className={`shrink-0 self-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  p.side === 'long'
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-rose-500/20 text-rose-200'
                                }`}
                              >
                                {p.side === 'long' ? 'Long' : 'Short'}
                              </span>
                            </div>
                            <div className="flex flex-col items-end border-t border-white/[0.08] pt-1.5 text-right">
                              <div className="flex items-baseline justify-end gap-1.5">
                                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-white/35">
                                  Bias
                                </span>
                                <p
                                  className={`min-w-0 text-[11px] font-bold leading-none ${
                                    positionBiasStat.variant === 'aligned'
                                      ? 'text-emerald-200/95'
                                      : positionBiasStat.variant === 'counter'
                                        ? 'text-amber-200/95'
                                        : 'text-white/75'
                                  }`}
                                >
                                  {positionBiasStat.title}
                                </p>
                              </div>
                              <p className="mt-0.5 max-w-full text-[10px] leading-snug text-white/45">
                                {positionBiasStat.subtitle}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex shrink-0 items-start gap-1.5">
                            <MiniPortfolioSpark
                              series={positionSparkSeries}
                              positive={positionSparkPositive}
                              w={120}
                              h={40}
                            />
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                p.side === 'long'
                                  ? 'bg-emerald-500/20 text-emerald-200'
                                  : 'bg-rose-500/20 text-rose-200'
                              }`}
                            >
                              {p.side === 'long' ? 'Long' : 'Short'}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="mt-1.5 rounded-xl border px-2.5 py-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${aiMeta.className}`}>
                          {aiMeta.label}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-white/35">AI read</span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium leading-snug text-cyan-100/90">{insight}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-white/40">{aiMeta.short}</p>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/trade?${baseQuery}`)}
                        className="rounded-xl border border-white/[0.1] bg-white/[0.04] py-2 text-[11px] font-bold text-white transition hover:bg-white/[0.07]"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/trade?${adjustQuery}`)}
                        className="rounded-xl border py-2 text-[11px] font-bold transition"
                        style={{
                          borderColor: `${ACCENT}55`,
                          color: ACCENT,
                          boxShadow: `inset 0 0 0 1px rgba(0,200,120,0.12)`,
                        }}
                      >
                        Adjust risk
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/trade?${closeQuery}`)}
                        className="rounded-xl border border-rose-400/25 bg-rose-500/10 py-2 text-[11px] font-bold text-rose-200 transition hover:bg-rose-500/15"
                      >
                        Close
                      </button>
                    </div>
                  </CardShell>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* 3. Bot performance */}
        <section className="space-y-3">
          <SectionTitle>Bot performance</SectionTitle>
          <div className="space-y-2.5">
            {botDayStats.map((row) => {
              const win = row.winRatePct ?? row.seedWinRatePct;
              const botAgent = mergedBots.find((b) => b.id === row.botId);
              const botPairKey = (botAgent?.watchedPairs[0] ?? 'BTC').toUpperCase();
              const botLiveCloses = candleCloses(miniCandles[botPairKey]);
              const botHasLiveMini = botLiveCloses.length >= 2;
              const botSparkSeries = botHasLiveMini
                ? botLiveCloses
                : buildSparklineSeries(
                    Math.max(12, Math.abs(row.dailyPnl) * 8 + 48),
                    row.dailyPnl >= 0,
                  );
              const botSparkPositive = botHasLiveMini
                ? sparkPositiveFromCloses(botLiveCloses)
                : row.dailyPnl >= 0;
              return (
                <CardShell key={row.botId} className="py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-base font-bold text-white">{row.name}</p>
                    <MiniPortfolioSpark
                      series={botSparkSeries}
                      positive={botSparkPositive}
                      w={124}
                      h={42}
                    />
                    <p
                      className={`shrink-0 font-mono text-sm font-bold tabular-nums ${row.dailyPnl >= 0 ? '' : 'text-rose-300'}`}
                      style={{ color: row.dailyPnl >= 0 ? ACCENT : undefined }}
                    >
                      {formatSignedUsd(row.dailyPnl)}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] text-white/45">
                    <span>
                      Trades today:{' '}
                      <span className="font-semibold text-white/75">{row.tradesToday}</span>
                    </span>
                    <span>
                      Win rate:{' '}
                      <span className="font-semibold text-white/75">{win}%</span>
                      {row.winRatePct == null ? (
                        <span className="text-white/35"> · model</span>
                      ) : null}
                    </span>
                  </div>
                </CardShell>
              );
            })}
          </div>
        </section>

        {/* 4. History */}
        <section className="space-y-3">
          <SectionTitle>History</SectionTitle>
          <CardShell className="p-0 overflow-hidden">
            {!connected ? (
              paperOrderRows.length === 0 ? (
                <p className="p-4 text-sm text-white/45">No simulated orders yet. Open a paper trade to begin.</p>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {paperOrderRows.map((order) => {
                    const up = (order.realizedPnlUsd ?? 0) >= 0;
                    return (
                      <li key={order.id} className="px-4 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">{order.pair}</p>
                            <p className="mt-0.5 text-[11px] text-white/40">
                              {order.type === 'open' ? 'Opened' : 'Closed'} · {order.side.toUpperCase()} · Paper
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-white/80">${formatUsd2(order.notionalUsd)}</p>
                            {order.realizedPnlUsd != null ? (
                              <p className={`text-[10px] ${up ? 'text-emerald-200/90' : 'text-rose-200/90'}`}>
                                {formatSignedUsd(order.realizedPnlUsd)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : loading ? (
              <p className="p-4 text-sm text-white/45">Loading history…</p>
            ) : historyRows.length === 0 ? (
              <p className="p-4 text-sm text-white/45">No closed fills in the current window.</p>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {historyRows.map((t, i) => {
                  const botName = attributeBotNameForSymbol(t.symbol, mergedBots);
                  const eqPct = closedPnlAsEquityPct(t.closedPnl, Math.max(netWorth, 1));
                  const up = t.closedPnl >= 0;
                  return (
                    <li key={`${t.exchange}-${t.orderId ?? i}-${t.closedAt}`} className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{pairLabel(t.symbol)}</p>
                          <p className="mt-0.5 text-[11px] text-white/40">
                            Realized ·{' '}
                            <span style={{ color: ACCENT }}>{botName}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-mono text-sm font-bold ${up ? '' : 'text-rose-300'}`}
                            style={{ color: up ? ACCENT : undefined }}
                          >
                            {formatSignedPercent(eqPct, 1)}
                          </p>
                          <p className="text-[10px] text-white/40">{formatSignedUsd(t.closedPnl)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-t border-white/[0.06] p-3">
              {connected ? (
                <a
                  href={BYBIT_APP_ASSETS_HOME_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl py-2.5 text-[11px] font-semibold transition hover:bg-white/[0.04]"
                  style={{ color: ACCENT }}
                >
                  Full ledger on Bybit →
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/trade')}
                  className="flex w-full items-center justify-center rounded-xl py-2.5 text-[11px] font-semibold transition hover:bg-white/[0.04]"
                  style={{ color: ACCENT }}
                >
                  Open Trade workspace →
                </button>
              )}
            </div>
          </CardShell>
        </section>

        {connected && positions.length > 0 ? (
          <p className="pb-4 text-center text-[11px] leading-relaxed text-white/35">
            Open PnL: {formatSignedUsd(unrealized)} unrealized across book.
          </p>
        ) : !connected && paperPositions.length > 0 ? (
          <p className="pb-4 text-center text-[11px] leading-relaxed text-white/35">
            Open PnL: {formatSignedUsd(paperSnapshot?.unrealizedPnlUsd ?? 0)} unrealized
            {paperSnapshot && paperSnapshot.realizedPnlUsd !== 0
              ? ` · ${formatSignedUsd(paperSnapshot.realizedPnlUsd)} realized`
              : ''}
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
