import type { AttributionRegime } from '@/lib/strategyAttribution';
import type { MarketRegime } from '@/types/aiGrounded';
import type { RegimeKind, RegimeTransitionPressures } from '@/types/regimePredictor';

/** User-facing labels for engine market-condition kinds (internal keys unchanged). */
export type MarketConditionKind = RegimeKind | AttributionRegime;

/** Bot scanning empty-state chips (Bots screen). */
export const BOT_SCAN_CHIPS = [
  'Breakout pressure building',
  'Trend pullbacks',
  'Momentum picking up',
] as const;

/** AI tone context labels (deep analysis / news scan packaging). */
export function groundedMarketToneLabel(regime: MarketRegime | string | null | undefined): string {
  switch (regime) {
    case 'trending':
      return 'Trending';
    case 'range':
      return 'Choppy';
    case 'risk_off':
      return 'Defensive';
    case 'transition':
      return 'Changing';
    default:
      if (!regime) return '—';
      return String(regime).replace(/_/g, ' ');
  }
}

export function momentumStateLabel(
  state: 'strengthening' | 'weakening' | 'flat' | 'unknown' | string | null | undefined,
): string {
  switch (state) {
    case 'strengthening':
      return 'Building';
    case 'weakening':
      return 'Fading';
    case 'flat':
      return 'Flat';
    case 'unknown':
      return 'Unclear';
    default:
      if (!state) return '—';
      return String(state).replace(/_/g, ' ');
  }
}

export function marketConditionLabel(kind: MarketConditionKind | string | null | undefined): string {
  switch (kind) {
    case 'trend':
      return 'Trending market';
    case 'range':
      return 'Choppy market';
    case 'volatile':
      return 'Fast-moving market';
    case 'compression':
      return 'Quiet market';
    default:
      if (!kind) return '—';
      return String(kind).replace(/_/g, ' ');
  }
}

export function transitionPressureLabel(key: keyof RegimeTransitionPressures): string {
  switch (key) {
    case 'trendToRange':
      return 'Trend losing strength';
    case 'rangeToTrend':
      return 'Trend trying to form';
    case 'compressionToExpansion':
      return 'Breakout pressure building';
    case 'expansionToCompression':
      return 'Market calming down';
    case 'stableToVolatile':
      return 'Market becoming unstable';
    case 'volatileToStable':
      return 'Market settling down';
    default:
      return key;
  }
}

export const MARKET_CONDITIONS_CHANGING_TITLE = 'Market conditions changing';
export const MARKET_CONDITIONS_LABEL = 'Market conditions';
export const LIKELY_NEXT_CONDITIONS_LABEL = 'Likely next conditions';
export const TREND_HEALTH_LABEL = 'Trend health';
export const CHANGE_RISK_LABEL = 'Change risk';
export const MARKET_ACTIVITY_LABEL = 'Market activity';

export const TREND_HEALTH_TOOLTIP = 'Internally calculated using regime stability metrics';
export const CHANGE_RISK_TOOLTIP = 'Internally calculated using transition-pressure metrics';

export const OVERALL_CHANGE_PRESSURE_LABEL = 'Overall change pressure';
export const BREAKOUT_RANGE_TIGHTNESS_LABEL = 'Range tightness';
export const BREAKOUT_RANGE_TIGHTNESS_TOOLTIP =
  'How tightly price has traded versus recent movement. Higher readings often mean a quieter range before a possible breakout.';
export const SCANNER_NEEDS_TIGHTER_RANGE = 'Needs a tighter trading range before trigger.';

const TRADER_COPY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/compression-to-expansion/gi, 'breakout pressure building'],
  [/compression\s*→\s*expansion/gi, 'breakout pressure building'],
  [/volatility\s+compression/gi, 'quiet range tightening'],
  [/volatility\s+regime/gi, 'market conditions'],
  [/directional\s+efficiency/gi, 'momentum follow-through'],
  [/regime\s+transition/gi, 'market conditions changing'],
  [/regime\s+stability/gi, 'trend health'],
  [/shift\s+probability/gi, 'change risk'],
  [/transition\s+pressure/gi, 'change risk'],
  [/inside\s+a\s+chop\/compression\s+zone/gi, 'in a choppy, tight range'],
  [/chop\/compression/gi, 'choppy, tight range'],
  [/low-volatility/gi, 'quiet market'],
  [/tactical\s+volatility/gi, 'fast-moving conditions'],
  [/volatility\s+is\s+muted/gi, 'price movement is quiet'],
  [/volatility\s+expanding/gi, 'market activity picking up'],
  [/volatility\s+compressing/gi, 'range tightening'],
  [/\bcompression\b/gi, 'tight range'],
  [/\bvolatility\b/gi, 'market activity'],
  [/\bregime\b/gi, 'market conditions'],
];

/** Presentation-only pass for engine-generated explanations shown in the UI. */
export function humanizeTraderCopy(text: string): string {
  let out = text;
  for (const [pattern, replacement] of TRADER_COPY_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
