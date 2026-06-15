import { buildSignalFromMarket, inferMarketRegime } from '@/lib/signalDetectors';
import { atr } from '@/lib/indicators';
import { defaultScannerFilterConfig, ENGINE_EMIT_CONFIG } from '@/lib/scannerEngineConfig';
import type { Candle } from '@/types/market';
import type { CryptoSignal } from '@/types/signal';
import { applySignalQualityControls } from '@/engine/filtering';
import type {
  CandleSeriesByInterval,
  EmittedSignalStateMap,
  ScannerFilterConfig,
  SignalCandidate,
} from '@/engine/types';

export interface ScannerInput {
  marketBySymbol: Record<string, CandleSeriesByInterval>;
  previousState?: EmittedSignalStateMap;
  filterConfig?: Partial<ScannerFilterConfig>;
}

export interface ScannerOutput {
  acceptedSignals: SignalCandidate[];
  allCandidates: SignalCandidate[];
  nextState: EmittedSignalStateMap;
}

const DEFAULT_FILTER_CONFIG = defaultScannerFilterConfig();

function closedCandles(series: Candle[] | undefined): Candle[] {
  if (!series?.length) return [];
  const lastOpen = series.at(-1)?.isClosed === false;
  return lastOpen ? series.slice(0, -1) : series;
}

function toSignalCandidate(symbol: string, signal: CryptoSignal, ts: number, candles15m: Candle[]): SignalCandidate {
  const close = candles15m.at(-1)?.close ?? 0;
  const atrNow = Math.max(atr(candles15m, 14).at(-1) ?? 0, 1e-6);
  return {
    symbol,
    setupType: signal.setupType,
    directionBias: signal.side,
    biasLabel: signal.biasLabel,
    tags: signal.setupTags,
    scoreBreakdown: signal.scoreBreakdown,
    setupScore: signal.setupScore,
    explanationFacts: {
      emaTrend:
        signal.facts?.emaTrend === 'bullish' || signal.facts?.emaTrend === 'bearish'
          ? signal.facts.emaTrend
          : 'neutral',
      rsi: Number(signal.facts?.rsi ?? 50),
      rsiSlope: 0,
      volumeRatio: Number(signal.facts?.volumeRatio ?? 1),
      breakoutDistanceAtr: Number(signal.facts?.distanceToBreakoutAtr ?? 0),
      pullbackDepthAtr: 0,
      extensionAtr: 0,
    },
    confirmedOnClosedCandle: true,
    timestamp: ts,
    timingState: signal.timingState,
    confidence: signal.confidence,
    triggerType: signal.triggerType,
    refPrice: close,
    atr: atrNow,
  };
}

/**
 * Production scanner pipeline — uses the same `buildSignalFromMarket` path as the live engine.
 */
export function runScannerPipeline(input: ScannerInput): ScannerOutput {
  const cfg = { ...DEFAULT_FILTER_CONFIG, ...input.filterConfig };
  const allCandidates: SignalCandidate[] = [];

  const btc15 = closedCandles(input.marketBySymbol.BTCUSDT?.['15m']);
  const eth15 = closedCandles(input.marketBySymbol.ETHUSDT?.['15m']);
  const regime =
    btc15.length >= ENGINE_EMIT_CONFIG.minClosedCandles15m &&
    eth15.length >= ENGINE_EMIT_CONFIG.minClosedCandles15m
      ? inferMarketRegime({ btc15m: btc15, eth15m: eth15 })
      : 'neutral';

  for (const [symbol, series] of Object.entries(input.marketBySymbol)) {
    const candles15m = closedCandles(series['15m']);
    if (candles15m.length < ENGINE_EMIT_CONFIG.minClosedCandles15m) continue;
    const candles5m = closedCandles(series['5m']);
    const last = candles15m.at(-1);
    const ticker = {
      symbol,
      lastPrice: last?.close ?? 0,
      high24h: last?.high ?? 0,
      low24h: last?.low ?? 0,
      volume24h: last?.volume ?? 0,
      turnover24h: 0,
      price24hPcnt: 0,
    };
    const built = buildSignalFromMarket({
      symbol,
      exchange: 'Bybit',
      ticker,
      candles15m,
      candles5m: candles5m.length >= ENGINE_EMIT_CONFIG.minClosedCandles5m ? candles5m : undefined,
      regime,
    });
    if (!built) continue;
    allCandidates.push(toSignalCandidate(symbol, built.signal, last?.ts ?? Date.now(), candles15m));
  }

  const { accepted, nextState } = applySignalQualityControls(
    allCandidates,
    input.previousState ?? {},
    cfg,
  );

  return {
    acceptedSignals: accepted.sort((a, b) => b.setupScore - a.setupScore),
    allCandidates,
    nextState,
  };
}
