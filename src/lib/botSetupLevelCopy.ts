import { formatBotPrice } from '@/lib/bots';
import {
  detectNearestResistanceFromChartCandles,
  detectNearestSupportFromChartCandles,
} from '@/lib/resistanceDetection';
import type { TradeChartCandle } from '@/types/trade';

export type LiveBotSetupCopy = {
  /** Nearest clustered swing above (long) or below (short), or null if nothing passes sanity filters. */
  level: number | null;
  structureKind: 'resistance' | 'support' | null;
  intentLine: string;
  commentaryShort: string;
  /** Explains that the level is from the active chart interval (builds trust vs stale mocks). */
  structureFootnote: string | null;
};

function biasNorm(bias: string): 'long' | 'short' | 'neutral' {
  const b = bias.trim().toLowerCase();
  if (b === 'short') return 'short';
  if (b === 'long') return 'long';
  return 'neutral';
}

/**
 * Production-safe copy for bot / setup UI: only injects a numeric level when swing logic + distance
 * + final % guard all pass. Otherwise uses non-numeric fallback so we never imply a fake trigger.
 */
export function buildLiveBotSetupCopy(args: {
  bias: string;
  candles: TradeChartCandle[] | undefined;
  currentPrice: number;
  /** e.g. "5m", "1H" — from active chart interval */
  intervalLabel?: string;
}): LiveBotSetupCopy | null {
  const { candles, currentPrice } = args;
  if (!(currentPrice > 0) || !candles?.length || candles.length < 5) {
    return null;
  }

  const interval = args.intervalLabel?.trim();
  const structureFootnote = interval ? `Structure from recent ${interval} candles (swing highs/lows).` : null;

  const side = biasNorm(args.bias);

  if (side === 'neutral') {
    return {
      level: null,
      structureKind: null,
      intentLine: 'Awaiting clearer structure',
      commentaryShort: 'Momentum context is mixed — waiting for the tape to tighten before flagging a level.',
      structureFootnote,
    };
  }

  if (side === 'long') {
    const level = detectNearestResistanceFromChartCandles(candles, currentPrice);
    return {
      level,
      structureKind: level != null ? 'resistance' : null,
      intentLine: 'Awaiting confirmation above resistance',
      commentaryShort:
        level != null
          ? `Momentum intact — needs acceptance above ${formatBotPrice(level)}.`
          : 'Momentum intact — waiting for structure to tighten.',
      structureFootnote,
    };
  }

  const level = detectNearestSupportFromChartCandles(candles, currentPrice);
  return {
    level,
    structureKind: level != null ? 'support' : null,
    intentLine: 'Awaiting confirmation below support',
    commentaryShort:
      level != null
        ? `Bearish thesis needs acceptance below ${formatBotPrice(level)}.`
        : 'Bearish thesis — waiting for structure to tighten before flagging a level.',
    structureFootnote,
  };
}
