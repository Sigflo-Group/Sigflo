import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useHoldStepper } from '@/hooks/useHoldStepper';
import { RiskSegmentMeter } from '@/components/ui/RiskSegmentMeter';
import type { MarketMode, RiskLevel, TradeSide } from '@/types/trade';
import { formatQuoteNumber } from '@/lib/formatQuote';
import { formatFundingBalance } from '@/lib/formatFundingBalance';
import {
  BYBIT_APP_ASSETS_HOME_HREF,
  BYBIT_TRANSFER_HELP_HREF,
  BYBIT_USER_ASSETS_EXCHANGE_HREF,
} from '@/lib/exchangeTransferUrls';
import {
  BYBIT_TPSL_TRIGGER_VALUES,
  bybitTpSlTriggerShortLabel,
  type BybitTpSlTriggerBy,
} from '@/lib/bybitTpSlTrigger';

function fmtUsd2(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function moneyTight(n: number) {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${abs.toFixed(2)}`;
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

const AMOUNT_INPUT_STEP_USD = 0.01;

/** Hard cap on native range `max` so the control stays responsive (avoid millions of DOM steps). */
const AMOUNT_SLIDER_INDEX_CAP = 500_000;

/**
 * How many discrete positions the amount slider uses: high enough for ~cent-level deltas on
 * typical balances; capped so a linear 0…`amountMax` slider is not limited by screen pixels.
 */
function computeAmountSliderIndexMax(amountMax: number): number {
  if (!Number.isFinite(amountMax) || amountMax <= 0) return 1;
  const idealCents = Math.ceil(amountMax / 0.01);
  return Math.min(AMOUNT_SLIDER_INDEX_CAP, Math.max(200, idealCents));
}

function amountUsdToSliderIndex(amountUsd: number, amountMax: number, indexMax: number): number {
  if (!(amountMax > 0) || indexMax <= 0) return 0;
  const a = Math.max(0, Math.min(amountMax, Number.isFinite(amountUsd) ? amountUsd : 0));
  const idx = Math.round((a / amountMax) * indexMax);
  return Math.min(indexMax, Math.max(0, idx));
}

function sliderIndexToAmountUsd(idx: number, amountMax: number, indexMax: number): number {
  if (!(amountMax > 0) || indexMax <= 0 || !Number.isFinite(idx)) return 0;
  const i = Math.min(indexMax, Math.max(0, Math.round(idx)));
  const raw = (i / indexMax) * amountMax;
  if (!Number.isFinite(raw)) return 0;
  return roundUsd(Math.min(amountMax, Math.max(0, raw)));
}

/** Stop loss slider: adverse move from entry (0–100%). */
const SL_PCT_SLIDER_MAX = 100;
const SL_PCT_STEP = 0.1;

/** One-tap adverse % presets (must stay ≤ SL_PCT_SLIDER_MAX). */
const SL_PCT_PRESETS = [0.2, 1, 2, 3, 5, 10, 15, 25, 50] as const;

/** Take profit slider: favorable move from entry (%). */
const TP_PCT_SLIDER_MIN = 0;
const TP_PCT_SLIDER_MAX = 500;
/** How closely the TP thumb / +% readout tracks implied % when price (e.g. mark) moves — not chip snaps (those would jump 25↔50). */
const TP_PCT_REFLECT_STEP = 0.1;

/** One-tap favorable % presets (clamped to slider range in UI). */
const TP_PCT_PRESETS = [0, 10, 25, 50, 100, 150, 200, 300, 400, 500] as const;

/** Scale-out % of the **open exchange leg** (partial TP) — shown under Take profit when eligible. */
const PARTIAL_POSITION_TP_PCTS = [25, 50, 75] as const;

/** Snap targets (slider only settles on these; includes 0% SL / TP preset list). */
const SL_SNAP_PCTS = [0, ...SL_PCT_PRESETS] as const;
const TP_SNAP_PCTS = TP_PCT_PRESETS;

/** Internal range resolution (linear thumb position 0…1000). */
const LEVEL_SLIDER_STEPS = 1000;

/** Must match `.sigflo-level-slider` thumb width in `index.css` (WebKit + Moz). */
const LEVEL_SLIDER_THUMB_PX = 20;

function nearestSnapPct(raw: number, snaps: readonly number[]): number {
  let best = snaps[0]!;
  let bestD = Math.abs(raw - best);
  for (const s of snaps) {
    const d = Math.abs(raw - s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function roundPctToStep(pct: number, step: number): number {
  if (!Number.isFinite(pct) || !(step > 0)) return 0;
  return Math.round(pct / step) * step;
}

function fmtPctCompact(pct: number): string {
  return Number.isInteger(pct) ? `${pct}` : pct.toFixed(1);
}

/**
 * SL/TP % anchor: `entry` = plan or avg entry; `last` = spot last only; `quote` = futures live quote
 * (mark → last → index — treated as one anchor for % sliders).
 */
export type SlTpPctBasis = 'entry' | 'last' | 'quote';

/** Single futures reference: fair/mark first (perp convention), then last, then index. */
function coalesceFuturesQuotePx(
  last: number | null,
  mark: number | null,
  index: number | null,
): number | null {
  if (mark != null && Number.isFinite(mark) && mark > 0) return mark;
  if (last != null && Number.isFinite(last) && last > 0) return last;
  if (index != null && Number.isFinite(index) && index > 0) return index;
  return null;
}

function pctBasisHeaderText(b: SlTpPctBasis, entryBasisUi: string): string {
  if (b === 'entry') return entryBasisUi;
  if (b === 'quote') return 'live';
  return 'last';
}

function pctBasisChipText(b: SlTpPctBasis, entryChipLabel: string): string {
  if (b === 'entry') return entryChipLabel;
  if (b === 'quote') return 'Live';
  return 'Last';
}

function slTpAwaitingSliderCopy(basis: SlTpPctBasis, sliderBlocked: boolean, m: MarketMode): string | null {
  if (!sliderBlocked || basis === 'entry') return null;
  if (basis === 'quote') {
    return m === 'futures' ? 'Waiting for a live quote (mark / last / index) — % slider stays off until then.' : null;
  }
  return 'Waiting for last price — % slider stays off until then.';
}

function pctBasisTooltip(basis: SlTpPctBasis, market: MarketMode, chip: 'entry' | 'avg'): string {
  if (basis === 'entry') {
    return chip === 'avg'
      ? 'Calculate from exchange average entry (filled)'
      : 'Calculate from plan / chart entry anchor';
  }
  if (basis === 'quote') {
    return market === 'futures'
      ? 'Calculate % from live perp quote (mark if available, else last traded, else index).'
      : 'Calculate from last traded price (order-book prints).';
  }
  return 'Calculate from last traded price (order-book prints).';
}

const FUTURES_SL_TP_PCT_BASES: SlTpPctBasis[] = ['entry'];
const SPOT_SL_TP_PCT_BASES: SlTpPctBasis[] = ['entry'];

/** Evenly spaces SL chip/tick centers along the track (last segment maps 50% → 100% for the thumb). */
function slChipLayoutNorm(chipIndex: number): number {
  const n = SL_SNAP_PCTS.length;
  if (n <= 1) return 0;
  return chipIndex / n;
}

function slPctFromLinearSteps(steps: number): number {
  const u = Math.min(1, Math.max(0, steps / LEVEL_SLIDER_STEPS));
  const s = SL_SNAP_PCTS as readonly number[];
  const n = s.length;
  if (n < 2) return u >= 1 ? SL_PCT_SLIDER_MAX : (s[0] ?? 0);

  const uLastChip = (n - 1) / n;
  if (u >= uLastChip) {
    if (u >= 1) return SL_PCT_SLIDER_MAX;
    const tail = 1 - uLastChip;
    const t = tail > 0 ? (u - uLastChip) / tail : 1;
    return s[n - 1]! + t * (SL_PCT_SLIDER_MAX - s[n - 1]!);
  }

  const f = u * n;
  const k = Math.min(n - 2, Math.max(0, Math.floor(f)));
  const u0 = k / n;
  const u1 = (k + 1) / n;
  const span = u1 - u0;
  const t = span > 0 ? (u - u0) / span : 0;
  return s[k]! + t * (s[k + 1]! - s[k]!);
}

function slLinearStepsFromPct(pct: number): number {
  const p = Math.min(SL_PCT_SLIDER_MAX, Math.max(0, pct));
  const s = SL_SNAP_PCTS as readonly number[];
  const n = s.length;
  if (n < 2) return Math.round((p / SL_PCT_SLIDER_MAX) * LEVEL_SLIDER_STEPS);

  if (p >= s[n - 1]!) {
    if (p >= SL_PCT_SLIDER_MAX) return LEVEL_SLIDER_STEPS;
    const uLastChip = (n - 1) / n;
    const tail = 1 - uLastChip;
    const denom = SL_PCT_SLIDER_MAX - s[n - 1]!;
    const t = denom > 0 ? (p - s[n - 1]!) / denom : 1;
    const u = uLastChip + t * tail;
    return Math.round(u * LEVEL_SLIDER_STEPS);
  }

  let k = 0;
  while (k < n - 1 && s[k + 1]! < p) k++;
  const lo = s[k]!;
  const hi = s[k + 1]!;
  const u0 = k / n;
  const u1 = (k + 1) / n;
  const span = hi - lo;
  const t = span > 0 ? (p - lo) / span : 0;
  const u = u0 + t * (u1 - u0);
  return Math.round(u * LEVEL_SLIDER_STEPS);
}

/**
 * Horizontal position where the range thumb *center* sits for `norm` in [0,1]
 * (thumb inset matches `.sigflo-level-slider` 20px width).
 */
function levelThumbAlignedStyle(norm: number, placement: 'label' | 'tickBelow' = 'label'): CSSProperties {
  const n = Math.min(1, Math.max(0, norm));
  const half = LEVEL_SLIDER_THUMB_PX / 2;
  const horizontal: CSSProperties = {
    left: `calc(${half}px + (100% - ${LEVEL_SLIDER_THUMB_PX}px) * ${n})`,
    transform: 'translateX(-50%)',
  };
  if (placement === 'tickBelow') {
    return {
      position: 'absolute',
      ...horizontal,
      top: 'auto',
      bottom: 0,
      width: 1,
      height: 5,
      borderRadius: 9999,
      backgroundColor: 'rgba(168, 162, 154, 0.42)',
      boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05)',
    };
  }
  return horizontal;
}

function tpChipLayoutNorm(chipIndex: number): number {
  const n = TP_SNAP_PCTS.length;
  if (n <= 1) return 0;
  return chipIndex / n;
}

function tpPctFromLinearSteps(steps: number): number {
  const u = Math.min(1, Math.max(0, steps / LEVEL_SLIDER_STEPS));
  const s = TP_SNAP_PCTS as readonly number[];
  const n = s.length;
  if (n < 2) {
    return u >= 1 ? TP_PCT_SLIDER_MAX : (s[0] ?? TP_PCT_SLIDER_MIN);
  }

  const uLastChip = (n - 1) / n;
  if (u >= uLastChip) {
    if (u >= 1) return TP_PCT_SLIDER_MAX;
    const tail = 1 - uLastChip;
    const t = tail > 0 ? (u - uLastChip) / tail : 1;
    return s[n - 1]! + t * (TP_PCT_SLIDER_MAX - s[n - 1]!);
  }

  const f = u * n;
  const k = Math.min(n - 2, Math.max(0, Math.floor(f)));
  const u0 = k / n;
  const u1 = (k + 1) / n;
  const span = u1 - u0;
  const t = span > 0 ? (u - u0) / span : 0;
  return s[k]! + t * (s[k + 1]! - s[k]!);
}

function tpLinearStepsFromPct(pct: number): number {
  const p = Math.min(TP_PCT_SLIDER_MAX, Math.max(TP_PCT_SLIDER_MIN, pct));
  const s = TP_SNAP_PCTS as readonly number[];
  const n = s.length;
  if (n < 2) {
    const span = TP_PCT_SLIDER_MAX - TP_PCT_SLIDER_MIN;
    return Math.round(span > 0 ? ((p - TP_PCT_SLIDER_MIN) / span) * LEVEL_SLIDER_STEPS : 0);
  }

  if (p >= s[n - 1]!) {
    if (p >= TP_PCT_SLIDER_MAX) return LEVEL_SLIDER_STEPS;
    const uLastChip = (n - 1) / n;
    const tail = 1 - uLastChip;
    const denom = TP_PCT_SLIDER_MAX - s[n - 1]!;
    const t = denom > 0 ? (p - s[n - 1]!) / denom : 1;
    const u = uLastChip + t * tail;
    return Math.round(u * LEVEL_SLIDER_STEPS);
  }

  let k = 0;
  while (k < n - 1 && s[k + 1]! < p) k++;
  const lo = s[k]!;
  const hi = s[k + 1]!;
  const u0 = k / n;
  const u1 = (k + 1) / n;
  const spanPct = hi - lo;
  const t = spanPct > 0 ? (p - lo) / spanPct : 0;
  const u = u0 + t * (u1 - u0);
  return Math.round(u * LEVEL_SLIDER_STEPS);
}

function distancePctToBps(pct: number): number {
  return Math.round(pct * 100);
}

function takeProfitPriceFromBps(entry: number, tradeSide: TradeSide, bps: number): number {
  const m = bps / 10000;
  return tradeSide === 'long' ? entry * (1 + m) : entry * (1 - m);
}

function stopPriceFromBps(entry: number, tradeSide: TradeSide, bps: number): number {
  const m = bps / 10000;
  return tradeSide === 'long' ? entry * (1 - m) : entry * (1 + m);
}

function impliedTakeProfitBps(entry: number, tradeSide: TradeSide, tp: number): number | null {
  if (!(entry > 0) || !Number.isFinite(tp)) return null;
  const raw =
    tradeSide === 'long' ? ((tp - entry) / entry) * 10000 : ((entry - tp) / entry) * 10000;
  if (!Number.isFinite(raw)) return null;
  return Math.round(raw);
}

function impliedStopBps(entry: number, tradeSide: TradeSide, stop: number): number | null {
  if (!(entry > 0) || !Number.isFinite(stop)) return null;
  const raw =
    tradeSide === 'long' ? ((entry - stop) / entry) * 10000 : ((stop - entry) / entry) * 10000;
  if (!Number.isFinite(raw)) return null;
  return Math.round(raw);
}

export function OrderInputsCard(props: {
  market: MarketMode;
  balanceUsd: number;
  /**
   * Live exchange line for the balance *display* (e.g. UTA available). When omitted, `balanceUsd` is shown.
   * Sizing / slider max use `balanceUsd`.
   */
  displayBalanceUsd?: number | null;
  amountUsd: number;
  leverage: number;
  side: TradeSide;
  positionSizeUsd: number;
  walletUsedPct: number;
  liquidationRisk: RiskLevel;
  onAmountChange: (v: number) => void;
  onLeverageChange: (v: number) => void;
  onSideChange: (s: TradeSide) => void;
  /** When true, Long/Short toggles are hidden (manage open leg or external execution buttons). */
  lockSide?: boolean;
  /** When false, the in-card Long/Short toggle is omitted (default false). */
  showSideToggle?: boolean;
  panelTitle?: string;
  hideLiquidationFooter?: boolean;
  /** Optional stop / take-profit price fields (USD quote). */
  stopInput?: string;
  takeProfitInput?: string;
  onStopInputChange?: (v: string) => void;
  onTakeProfitInputChange?: (v: string) => void;
  /** For ≈ base size line and SL/TP % hints. */
  quoteLastPrice?: number;
  /** Futures: mark — merged with last/index into one “Live” % anchor. */
  quoteMarkPrice?: number;
  /** Futures: index — merged with mark/last into one “Live” % anchor. */
  quoteIndexPrice?: number;
  /** Futures: which price type hits TP/SL first on Bybit (MEXC-style trigger). */
  futuresTpSlTriggerBy?: BybitTpSlTriggerBy;
  onFuturesTpSlTriggerByChange?: (t: BybitTpSlTriggerBy) => void;
  quotePair?: string;
  referenceEntryPrice?: number;
  /** Explicit account label (e.g. "Available to Trade"). */
  balanceLabel?: string;
  /** Optional helper under balance label. */
  balanceHelper?: string;
  /** Funding account primary line — informational, not used for sizing. */
  fundingBalanceUsd?: number | null;
  /** Asset for `fundingBalanceUsd` (e.g. AUD, USDT). */
  fundingBalanceAsset?: string | null;
  /** Minimum order notional for selected market/symbol (USD). */
  minOrderUsd?: number | null;
  /** Selected execution symbol (e.g. BTCUSDT) for validation messaging. */
  orderSymbol?: string | null;
  /** Futures: max leverage for this contract (from exchange instruments); defaults to 200 until known. */
  maxLeverage?: number | null;
  /** Unified trading account: margin / collateral in use (USD), from exchange overview. */
  utaMarginInUseUsd?: number | null;
  /** UTA equity from Bybit (includes unrealized PnL on real positions). */
  utaEquityUsd?: number | null;
  /** Aggregate unrealized PnL on exchange (UTA / perps), from account sync. */
  utaUnrealizedPnlUsd?: number | null;
  /** UTA wallet balance from Bybit (distinct from equity when positions are open). */
  utaWalletBalanceUsd?: number | null;
  /**
   * When set, shows a Transfer control that opens the exchange transfer UI in a new tab
   * (e.g. Bybit Funding ↔ Unified Trading Account). Trading still uses separate Long/Short / Close actions.
   */
  assetTransferHref?: string | null;
  /** Inline summary: margin, fee, liq, risk — shown above the footer row when provided. */
  compactStats?: {
    marginUsd: number;
    estFeeUsd: number;
    liquidationPrice: number | null;
    riskLevel?: RiskLevel;
    riskMeterPct?: number;
  };
  /** Under Take profit: submit partial close at 25% / 50% / 75% of open leg (Bybit). */
  onPartialPositionScaleOut?: (fraction: number) => void;
  partialPositionScaleOutBusy?: boolean;
  /**
   * When `avg`, the first SL/TP % basis chip reads "Avg" and uses exchange average entry (via `referenceEntryPrice`).
   * When `entry`, chip reads "Entry" for plan/anchor entry from the parent model.
   */
  slTpEntryChip?: 'entry' | 'avg';
}) {
  const {
    market,
    balanceUsd,
    displayBalanceUsd,
    amountUsd,
    leverage,
    side,
    positionSizeUsd,
    walletUsedPct,
    liquidationRisk,
    onAmountChange,
    onLeverageChange,
    onSideChange,
    lockSide = false,
    showSideToggle = false,
    panelTitle = 'Position',
    hideLiquidationFooter = false,
    stopInput,
    takeProfitInput,
    onStopInputChange,
    onTakeProfitInputChange,
    compactStats,
    quoteLastPrice,
    quoteMarkPrice,
    quoteIndexPrice,
    futuresTpSlTriggerBy,
    onFuturesTpSlTriggerByChange,
    quotePair,
    referenceEntryPrice,
    balanceLabel = 'Wallet Balance',
    balanceHelper,
    fundingBalanceUsd,
    fundingBalanceAsset,
    minOrderUsd,
    orderSymbol,
    maxLeverage,
    utaMarginInUseUsd,
    utaEquityUsd,
    utaUnrealizedPnlUsd,
    utaWalletBalanceUsd,
    assetTransferHref,
    onPartialPositionScaleOut,
    partialPositionScaleOutBusy = false,
    slTpEntryChip = 'entry',
  } = props;

  const entryBasisUi = slTpEntryChip === 'avg' ? 'avg' : 'entry';
  const entryChipLabel = slTpEntryChip === 'avg' ? 'Avg' : 'Entry';

  const balanceShown =
    displayBalanceUsd != null && Number.isFinite(displayBalanceUsd) ? displayBalanceUsd : balanceUsd;
  const amountMax = Math.max(0, Number.isFinite(balanceUsd) ? balanceUsd : 0);
  const amountInputStep = AMOUNT_INPUT_STEP_USD;
  const amountSliderIndexMax = computeAmountSliderIndexMax(amountMax);
  const amountSliderUiIndexRaw = amountUsdToSliderIndex(amountUsd, amountMax, amountSliderIndexMax);
  const amountSliderUiIndex = Number.isFinite(amountSliderUiIndexRaw)
    ? Math.min(amountSliderIndexMax, Math.max(0, Math.round(amountSliderUiIndexRaw)))
    : 0;
  const clampAmount = (n: number) => roundUsd(Math.max(0, Math.min(amountMax, Number.isFinite(n) ? n : 0)));

  const amountUsdRef = useRef(amountUsd);
  amountUsdRef.current = amountUsd;
  const holdAmountUp = useHoldStepper(() => {
    onAmountChange(clampAmount(amountUsdRef.current + amountInputStep));
  });
  const holdAmountDown = useHoldStepper(() => {
    onAmountChange(clampAmount(amountUsdRef.current - amountInputStep));
  });

  const [slEnabled, setSlEnabled] = useState(() => {
    if (stopInput != null && stopInput !== '') {
      const n = parseFloat(String(stopInput).replace(/,/g, ''));
      return Number.isFinite(n) && n > 0;
    }
    return false;
  });
  const [tpEnabled, setTpEnabled] = useState(() => {
    if (takeProfitInput != null && takeProfitInput !== '') {
      const n = parseFloat(String(takeProfitInput).replace(/,/g, ''));
      return Number.isFinite(n) && n > 0;
    }
    return false;
  });
  const [marginMode, setMarginMode] = useState<'cross' | 'isolated'>('cross');
  const [slPercentBasis, setSlPercentBasis] = useState<SlTpPctBasis>('entry');
  const [tpPercentBasis, setTpPercentBasis] = useState<SlTpPctBasis>('entry');

  useEffect(() => {
    if (market === 'spot') {
      setSlPercentBasis((b) => (b === 'quote' ? 'last' : b));
      setTpPercentBasis((b) => (b === 'quote' ? 'last' : b));
    } else {
      setSlPercentBasis((b) => (b === 'last' ? 'quote' : b));
      setTpPercentBasis((b) => (b === 'last' ? 'quote' : b));
    }
  }, [market]);

  useEffect(() => {
    if (stopInput != null && stopInput !== '') {
      const n = parseFloat(String(stopInput).replace(/,/g, ''));
      if (Number.isFinite(n) && n > 0) setSlEnabled(true);
    }
  }, [stopInput]);

  useEffect(() => {
    if (takeProfitInput != null && takeProfitInput !== '') {
      const n = parseFloat(String(takeProfitInput).replace(/,/g, ''));
      if (Number.isFinite(n) && n > 0) setTpEnabled(true);
    }
  }, [takeProfitInput]);

  const riskColor = liquidationRisk === 'High' ? 'text-rose-400' : liquidationRisk === 'Medium' ? 'text-amber-300' : 'text-emerald-400';

  const showLevels = Boolean(onStopInputChange && onTakeProfitInputChange && stopInput !== undefined && takeProfitInput !== undefined);

  const baseSymbol =
    quotePair?.includes('/') === true
      ? quotePair.split('/')[0]?.trim() || '—'
      : quotePair?.replace(/USDT$/i, '').trim() || '—';
  const baseApprox =
    quoteLastPrice != null && quoteLastPrice > 0 && Number.isFinite(positionSizeUsd)
      ? positionSizeUsd / quoteLastPrice
      : null;

  const feePctOfNotional =
    positionSizeUsd > 0 && compactStats ? (compactStats.estFeeUsd / positionSizeUsd) * 100 : 0;

  const entry = referenceEntryPrice;
  const stopN = stopInput != null ? parseFloat(String(stopInput).replace(/,/g, '')) : NaN;
  const tpN = takeProfitInput != null ? parseFloat(String(takeProfitInput).replace(/,/g, '')) : NaN;
  const entryNum = entry != null && entry > 0 ? entry : null;
  const lastNum = quoteLastPrice != null && Number.isFinite(quoteLastPrice) && quoteLastPrice > 0 ? quoteLastPrice : null;
  const exchangeMarkNum =
    quoteMarkPrice != null && Number.isFinite(quoteMarkPrice) && quoteMarkPrice > 0 ? quoteMarkPrice : null;
  const exchangeIndexNum =
    quoteIndexPrice != null && Number.isFinite(quoteIndexPrice) && quoteIndexPrice > 0 ? quoteIndexPrice : null;
  const quoteNum = market === 'futures' ? coalesceFuturesQuotePx(lastNum, exchangeMarkNum, exchangeIndexNum) : null;

  const slReferencePrice: number | null =
    slPercentBasis === 'entry'
      ? entryNum
      : slPercentBasis === 'quote'
        ? quoteNum
        : lastNum;
  const tpReferencePrice: number | null =
    tpPercentBasis === 'entry'
      ? entryNum
      : tpPercentBasis === 'quote'
        ? quoteNum
        : lastNum;

  const hasQuoteContext = entryNum != null;
  const showSlPctPanel = Boolean(onStopInputChange) && hasQuoteContext;
  const showTpPctPanel = Boolean(onTakeProfitInputChange) && hasQuoteContext;
  const slPctSliderBlocked = slReferencePrice == null;
  const tpPctSliderBlocked = tpReferencePrice == null;
  const slAwaitingMsg = slTpAwaitingSliderCopy(slPercentBasis, slPctSliderBlocked, market);
  const tpAwaitingMsg = slTpAwaitingSliderCopy(tpPercentBasis, tpPctSliderBlocked, market);

  /** Same anchor as SL/TP sliders (entry vs live quote). */
  const stopPctHint =
    slReferencePrice != null &&
    slReferencePrice > 0 &&
    Number.isFinite(stopN) &&
    stopN > 0
      ? ((stopN - slReferencePrice) / slReferencePrice) * 100 * (side === 'long' ? 1 : -1)
      : null;
  const tpPctHint =
    tpReferencePrice != null &&
    tpReferencePrice > 0 &&
    Number.isFinite(tpN) &&
    tpN > 0
      ? ((tpN - tpReferencePrice) / tpReferencePrice) * 100 * (side === 'long' ? 1 : -1)
      : null;

  const tpBpsImpliedByBasis =
    tpReferencePrice != null ? impliedTakeProfitBps(tpReferencePrice, side, tpN) : null;

  const slBpsImpliedByBasis =
    slReferencePrice != null ? impliedStopBps(slReferencePrice, side, stopN) : null;
  const slSliderPct =
    slEnabled && slReferencePrice != null && slBpsImpliedByBasis != null
      ? Math.min(SL_PCT_SLIDER_MAX, Math.max(0, roundPctToStep(slBpsImpliedByBasis / 100, SL_PCT_STEP)))
      : 0;
  /** Reflect implied % with fine steps so live quote moves do not quantize to coarse presets (avoids 50%↔25% jumps). */
  const tpSliderPct =
    !tpEnabled || tpReferencePrice == null
      ? 100
      : tpBpsImpliedByBasis != null
        ? Math.min(
            TP_PCT_SLIDER_MAX,
            Math.max(
              TP_PCT_SLIDER_MIN,
              roundPctToStep(tpBpsImpliedByBasis / 100, TP_PCT_REFLECT_STEP),
            ),
          )
        : 100;

  const slSliderLinearSteps = useMemo(
    () => (slEnabled ? slLinearStepsFromPct(slSliderPct) : 0),
    [slEnabled, slSliderPct],
  );
  const tpSliderLinearSteps = useMemo(
    () => (tpEnabled ? tpLinearStepsFromPct(tpSliderPct) : tpLinearStepsFromPct(100)),
    [tpEnabled, tpSliderPct],
  );

  const levMax =
    market === 'futures'
      ? Math.max(
          1,
          Math.min(
            200,
            Math.floor(
              maxLeverage != null && Number.isFinite(maxLeverage) && maxLeverage > 0 ? maxLeverage : 200,
            ),
          ),
        )
      : 1;
  const leverageChipLevels = useMemo(() => {
    const preset = [2, 5, 10, 25, 50, 100, 200].filter((x) => x <= levMax);
    if (levMax > 1 && !preset.includes(levMax)) {
      return [...preset, levMax].sort((a, b) => a - b);
    }
    return preset;
  }, [levMax]);
  const symbolLabel = (orderSymbol ?? quotePair ?? 'selected market').toUpperCase();
  const minOrderOk = minOrderUsd != null && Number.isFinite(minOrderUsd) && minOrderUsd > 0;
  const enteredAmountValid = Number.isFinite(amountUsd) && amountUsd > 0;
  const amountTooSmall = minOrderOk && enteredAmountValid && amountUsd < (minOrderUsd as number);
  /** Cent compare: 100% chip can land on rounded cap while float `amountMax` differs slightly. */
  const amountTooLarge =
    enteredAmountValid &&
    amountMax > 0 &&
    Math.round(amountUsd * 100) > Math.round(amountMax * 100);
  const balanceTooLowForMinimum = minOrderOk && amountMax > 0 && amountMax < (minOrderUsd as number);
  const sizeValidationMessage =
    amountMax <= 0
      ? 'Insufficient available balance'
      : balanceTooLowForMinimum
        ? 'Insufficient available balance'
        : amountTooLarge
          ? 'Insufficient available balance'
          : amountTooSmall
            ? `Minimum order for ${symbolLabel} is ${fmtUsd2(minOrderUsd as number)}`
            : null;

  const showUtaBreakdown = Boolean(balanceHelper);
  const showFundingWallet =
    fundingBalanceUsd != null && Number.isFinite(fundingBalanceUsd) && fundingBalanceUsd >= 0;

  const transferBtnClassName =
    'shrink-0 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-sigflo-muted/85 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-sigflo-text/75';

  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    if (!transferModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTransferModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transferModalOpen]);

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.04] to-sigflo-surface/95 p-3 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm space-y-3">
      <div className="flex items-start justify-between gap-2 text-xs text-sigflo-muted">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-sm font-bold text-white">{panelTitle}</span>
          {assetTransferHref && !showFundingWallet ? (
            <button
              type="button"
              title="Move funds on Bybit (Funding ↔ Unified)"
              onClick={() => setTransferModalOpen(true)}
              className={transferBtnClassName}
            >
              Transfer
            </button>
          ) : null}
        </div>
        <span className="shrink-0 max-w-[min(100%,18rem)] text-right">
          {showUtaBreakdown ? (
            <>
              <div
                className={`grid w-full max-w-md justify-end gap-1.5 sm:ml-auto ${utaEquityUsd != null && Number.isFinite(utaEquityUsd) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} grid-cols-1`}
              >
                <div
                  className="min-w-0 rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-left"
                  title="Collateral available for new orders in your Bybit unified trading account"
                >
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">
                    Available (UTA)
                  </span>
                  <span className="block tabular-nums text-[11px] text-sigflo-text">{fmtUsd2(balanceShown)}</span>
                  <span className="block text-[8px] leading-tight text-sigflo-muted/80">For new orders</span>
                </div>
                <div
                  className="min-w-0 rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-left"
                  title="Margin and collateral reserved for open exchange positions and working orders"
                >
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Margin in use</span>
                  <span className="block tabular-nums text-[11px] text-white/90">
                    {utaMarginInUseUsd != null && Number.isFinite(utaMarginInUseUsd) ? fmtUsd2(utaMarginInUseUsd) : '—'}
                  </span>
                  <span className="block text-[8px] leading-tight text-sigflo-muted/80">Exchange positions</span>
                </div>
                {utaEquityUsd != null && Number.isFinite(utaEquityUsd) ? (
                  <div
                    className="min-w-0 rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-left"
                    title="Total UTA equity per Bybit (includes unrealized PnL on real positions)"
                  >
                    <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Equity (UTA)</span>
                    <span className="block tabular-nums text-[11px] text-cyan-200/95">{fmtUsd2(utaEquityUsd)}</span>
                    <span className="block text-[8px] leading-tight text-sigflo-muted/80">Incl. unrealized (Bybit)</span>
                  </div>
                ) : null}
              </div>
              {utaUnrealizedPnlUsd != null && Number.isFinite(utaUnrealizedPnlUsd) ? (
                <span className="mt-1 block text-right text-[9px] tabular-nums text-sigflo-muted/85">
                  Unrealized PnL on exchange:{' '}
                  <span className={utaUnrealizedPnlUsd >= 0 ? 'text-emerald-200/90' : 'text-rose-200/90'}>
                    {utaUnrealizedPnlUsd >= 0 ? '+' : '−'}
                    {fmtUsd2(Math.abs(utaUnrealizedPnlUsd))}
                  </span>
                </span>
              ) : null}
              {utaWalletBalanceUsd != null &&
              Number.isFinite(utaWalletBalanceUsd) &&
              (utaEquityUsd == null ||
                !Number.isFinite(utaEquityUsd) ||
                Math.abs(utaWalletBalanceUsd - utaEquityUsd) > 0.02) ? (
                <span className="mt-0.5 block text-right text-[9px] tabular-nums text-sigflo-muted/75">
                  Wallet balance (UTA, Bybit): {fmtUsd2(utaWalletBalanceUsd)}
                </span>
              ) : null}
              <span className="mt-1 block text-[9px] text-sigflo-muted/80">{balanceHelper}</span>
            </>
          ) : (
            <>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-sigflo-muted/90">{balanceLabel}</span>
              <span className="block tabular-nums text-[11px] text-sigflo-text">{money(balanceShown)}</span>
              {balanceHelper ? <span className="block text-[9px] text-sigflo-muted/80">{balanceHelper}</span> : null}
            </>
          )}
          {showFundingWallet ? (
            <div className="mt-2 border-t border-white/[0.06] pt-2">
              <div className="flex w-full min-w-0 items-center justify-end gap-2">
                {assetTransferHref ? (
                  <button
                    type="button"
                    title="Move funds on Bybit (Funding ↔ Unified)"
                    onClick={() => setTransferModalOpen(true)}
                    className={`relative z-[1] -translate-x-6 ${transferBtnClassName}`}
                  >
                    Transfer
                  </button>
                ) : null}
                <span className="text-right text-[9px] font-semibold uppercase tracking-[0.08em] text-sigflo-muted/90">
                  Funding wallet
                </span>
              </div>
              <span className="mt-0.5 block tabular-nums text-[10px] text-sigflo-muted">
                {formatFundingBalance(fundingBalanceUsd, fundingBalanceAsset)}
              </span>
              <span
                className="mt-0.5 block max-w-[11rem] text-[8px] leading-tight text-sigflo-muted/75 sm:max-w-none"
                title="Separate deposit wallet — not included in Available / In use above until you transfer to UTA"
              >
                Not in unified trading — use Transfer to move funds to UTA for orders
              </span>
            </div>
          ) : null}
        </span>
      </div>

      <label className="block space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Amount (USD)</span>
        <div className="group relative">
          <input
            type="number"
            min={0}
            max={amountMax}
            step={amountInputStep}
            value={amountUsd || ''}
            onChange={(e) => {
              const n = Number(e.target.value || 0);
              onAmountChange(clampAmount(n));
            }}
            className="sigflo-number-input w-full rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2.5 pr-11 text-sm text-white outline-none ring-sigflo-accent/30 placeholder:text-sigflo-muted focus:ring"
            placeholder="0"
          />
          <div className="absolute inset-y-1.5 right-1 flex w-7 flex-col gap-1">
            <button
              type="button"
              className="flex h-1/2 select-none items-center justify-center rounded border border-white/[0.08] bg-white/[0.06] text-[9px] leading-none text-sigflo-text transition hover:bg-white/[0.12]"
              aria-label="Increase amount"
              {...holdAmountUp}
            >
              +
            </button>
            <button
              type="button"
              className="flex h-1/2 select-none items-center justify-center rounded border border-white/[0.08] bg-white/[0.06] text-[9px] leading-none text-sigflo-text transition hover:bg-white/[0.12]"
              aria-label="Decrease amount"
              {...holdAmountDown}
            >
              −
            </button>
          </div>
        </div>
        {baseApprox != null ? (
          <p className="text-[11px] tabular-nums text-sigflo-muted">
            ≈ {formatQuoteNumber(baseApprox)} {baseSymbol}
          </p>
        ) : null}
        {sizeValidationMessage ? (
          <p className="text-[10px] font-medium text-amber-200/90">{sizeValidationMessage}</p>
        ) : minOrderOk ? (
          <p className="text-[10px] text-sigflo-muted/85">
            Minimum order for {symbolLabel}: {fmtUsd2(minOrderUsd as number)}
          </p>
        ) : null}
      </label>

      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={amountSliderIndexMax}
          step={1}
          value={amountSliderUiIndex}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            onAmountChange(
              clampAmount(sliderIndexToAmountUsd(v, amountMax, amountSliderIndexMax)),
            );
          }}
          className="w-full accent-[#00ffc8]"
          aria-label="Amount slider"
        />
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {[
            { id: '10', label: '10%', v: 0.1 },
            { id: '25', label: '25%', v: 0.25 },
            { id: '50', label: '50%', v: 0.5 },
            { id: '100', label: '100%', v: 1 },
          ].map((chip) => {
            const target = roundUsd(amountMax * chip.v);
            const active =
              amountMax > 0 &&
              Math.abs(amountUsd - target) < Math.max(0.01, Math.min(1, amountMax * 0.02));
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onAmountChange(target)}
                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                  active
                    ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/25'
                    : 'border-white/[0.08] bg-white/[0.04] text-sigflo-muted hover:border-sigflo-accent/25 hover:bg-sigflo-accent/10 hover:text-sigflo-text'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {market === 'futures' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sigflo-muted">Margin</span>
            <div className="flex rounded-lg bg-black/40 p-0.5">
              {(['cross', 'isolated'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarginMode(m)}
                  className={`rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition ${
                    marginMode === m ? 'bg-[#00ffc8]/20 text-[#00ffc8] ring-1 ring-[#00ffc8]/30' : 'text-sigflo-muted'
                  }`}
                >
                  {m === 'cross' ? 'Cross' : 'Isolated'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sigflo-muted">Leverage</span>
            <span className="text-sm font-bold tabular-nums text-white">{Math.min(leverage, levMax)}x</span>
          </div>
          <div className="flex justify-between text-[9px] tabular-nums text-sigflo-muted">
            <span>1x</span>
            <span>{levMax}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={levMax}
            step={1}
            value={Math.min(leverage, levMax)}
            onChange={(e) => onLeverageChange(Number(e.target.value))}
            className="w-full accent-[#00ffc8]"
          />
          <div className="flex flex-wrap justify-end gap-1">
            {leverageChipLevels.map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => onLeverageChange(Math.min(x, levMax))}
                className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold tabular-nums transition ${
                  leverage === x
                    ? 'border-[#00ffc8]/50 bg-[#00ffc8]/15 text-[#00ffc8]'
                    : 'border-white/[0.08] bg-white/[0.04] text-sigflo-muted hover:border-[#00ffc8]/25 hover:text-sigflo-text'
                }`}
              >
                {x}x
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-1.5 text-center text-[10px] font-semibold text-sigflo-muted">Spot · no leverage</p>
      )}

      {showLevels ? (
        <div className="space-y-2">
          {market === 'futures' &&
          BYBIT_TPSL_TRIGGER_VALUES.length > 1 &&
          futuresTpSlTriggerBy != null &&
          onFuturesTpSlTriggerByChange ? (
            <div className="rounded-xl border border-white/[0.08] bg-black/30 px-2.5 py-2 ring-1 ring-white/[0.04]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">TP / SL trigger</p>
              <p className="mt-0.5 text-[8px] leading-snug text-sigflo-muted/80">
                Bybit: which price crosses your levels first (same as MEXC Last / Fair / Index).
              </p>
              <div className="mt-1.5 inline-flex flex-wrap rounded-md border border-white/[0.08] bg-black/35 p-0.5">
                {BYBIT_TPSL_TRIGGER_VALUES.map((t) => {
                  const active = futuresTpSlTriggerBy === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onFuturesTpSlTriggerByChange(t)}
                      className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] transition ${
                        active
                          ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/30'
                          : 'text-sigflo-muted hover:text-sigflo-text'
                      }`}
                      title={t === 'MarkPrice' ? 'Mark / fair price' : t === 'LastPrice' ? 'Last traded price' : 'Index price'}
                    >
                      {bybitTpSlTriggerShortLabel(t)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Stop loss</span>
              <button
                type="button"
                role="switch"
                aria-checked={slEnabled}
                onClick={() => {
                  setSlEnabled((v) => {
                    const next = !v;
                    if (!next) onStopInputChange?.('');
                    return next;
                  });
                }}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                  slEnabled ? 'bg-rose-500/35 ring-1 ring-rose-400/35' : 'bg-white/[0.08]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    slEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={stopInput}
              disabled={!slEnabled}
              onChange={(e) => onStopInputChange?.(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-2.5 py-2 text-xs text-white outline-none ring-rose-400/20 focus:ring disabled:cursor-not-allowed disabled:opacity-45"
              placeholder="USDT"
              aria-label="Stop loss price"
            />
            {showSlPctPanel ? (
              <div className="mt-1.5 space-y-1.5 rounded-xl border border-white/[0.07] bg-black/35 px-2.5 py-2 ring-1 ring-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">
                      % from {pctBasisHeaderText(slPercentBasis, entryBasisUi)} (adverse)
                    </span>
                    <div className="inline-flex flex-wrap rounded-md border border-white/[0.08] bg-black/30 p-0.5">
                      {(market === 'futures' ? FUTURES_SL_TP_PCT_BASES : SPOT_SL_TP_PCT_BASES).map((basis) => {
                        const active = slPercentBasis === basis;
                        return (
                          <button
                            key={basis}
                            type="button"
                            onClick={() => setSlPercentBasis(basis)}
                            className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] transition ${
                              active
                                ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/30'
                                : 'text-sigflo-muted hover:text-sigflo-text'
                            }`}
                            title={pctBasisTooltip(basis, market, slTpEntryChip)}
                          >
                            {pctBasisChipText(basis, entryChipLabel)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <span
                    className={`text-[12px] font-bold tabular-nums ${slEnabled ? 'text-rose-200' : 'text-sigflo-muted'}`}
                  >
                    {slEnabled ? `−${fmtPctCompact(slSliderPct)}%` : '—'}
                  </span>
                </div>
                {entryNum != null ? (
                  <p className="text-[7px] font-mono tabular-nums leading-tight text-sigflo-muted/85">
                    {slTpEntryChip === 'avg' ? 'Avg' : 'Entry'} ${formatQuoteNumber(entryNum)}
                  </p>
                ) : null}
                {slAwaitingMsg ? (
                  <p className="text-[7px] leading-snug text-amber-200/85">{slAwaitingMsg}</p>
                ) : null}
                <div className="relative w-full">
                  <input
                    type="range"
                    min={0}
                    max={LEVEL_SLIDER_STEPS}
                    step={1}
                    disabled={!slEnabled || slReferencePrice == null}
                    value={slSliderLinearSteps}
                    aria-label={`Stop loss percent from ${pctBasisHeaderText(slPercentBasis, entryBasisUi)} on adverse side`}
                    onChange={(e) => {
                      const rawPct = slPctFromLinearSteps(Number(e.target.value));
                      const pct = Math.min(SL_PCT_SLIDER_MAX, Math.max(0, roundPctToStep(rawPct, SL_PCT_STEP)));
                      if (slReferencePrice == null || !onStopInputChange) return;
                      setSlEnabled(true);
                      onStopInputChange(
                        formatQuoteNumber(stopPriceFromBps(slReferencePrice, side, distancePctToBps(pct))),
                      );
                    }}
                    className="sigflo-level-slider sigflo-level-slider--rose relative z-[1] w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <div
                    className="pointer-events-none relative mt-px h-1.5 w-full shrink-0"
                    aria-hidden
                  >
                    {SL_SNAP_PCTS.map((pct, i) => {
                      const norm = slChipLayoutNorm(i);
                      return (
                        <span
                          key={`sl-tick-${pct}`}
                          className="pointer-events-none"
                          style={levelThumbAlignedStyle(norm, 'tickBelow')}
                        />
                      );
                    })}
                  </div>
                  <div className="relative z-[1] mt-1 h-5 w-full">
                    {SL_SNAP_PCTS.map((pct, i) => {
                      const on = slEnabled && slSliderPct === pct;
                      const norm = slChipLayoutNorm(i);
                      return (
                        <button
                          key={`sl-m-${pct}`}
                          type="button"
                          disabled={slReferencePrice == null}
                          onClick={() => {
                            if (slReferencePrice == null || !onStopInputChange) return;
                            setSlEnabled(true);
                            onStopInputChange(
                              formatQuoteNumber(stopPriceFromBps(slReferencePrice, side, distancePctToBps(pct))),
                            );
                          }}
                          title={`${pct}% adverse`}
                          style={levelThumbAlignedStyle(norm)}
                          className={`absolute top-0 max-w-[2.25rem] truncate text-center text-[6.5px] font-bold tabular-nums leading-none transition sm:text-[7px] ${
                            on ? 'text-rose-200' : 'text-sigflo-muted/75 hover:text-rose-100/90'
                          } disabled:pointer-events-none disabled:opacity-35`}
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between text-[8px] font-medium tabular-nums text-sigflo-muted/75">
                  <span>
                    0% ({pctBasisHeaderText(slPercentBasis, entryBasisUi)})
                  </span>
                  <span>{SL_PCT_SLIDER_MAX}% max</span>
                </div>
              </div>
            ) : stopPctHint != null && Number.isFinite(stopPctHint) ? (
              <p
                className={`mt-1 text-[9px] font-semibold tabular-nums leading-none ${stopPctHint <= 0 ? 'text-rose-300' : 'text-sigflo-muted'}`}
              >
                {stopPctHint >= 0 ? '+' : ''}
                {stopPctHint.toFixed(2)}%
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Take profit</span>
              <button
                type="button"
                role="switch"
                aria-checked={tpEnabled}
                onClick={() => {
                  setTpEnabled((v) => {
                    const next = !v;
                    if (!next) onTakeProfitInputChange?.('');
                    return next;
                  });
                }}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                  tpEnabled ? 'bg-emerald-500/35 ring-1 ring-emerald-400/35' : 'bg-white/[0.08]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    tpEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={takeProfitInput}
              disabled={!tpEnabled}
              onChange={(e) => onTakeProfitInputChange?.(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-2.5 py-2 text-xs text-white outline-none ring-emerald-400/20 focus:ring disabled:cursor-not-allowed disabled:opacity-45"
              placeholder="USDT"
              aria-label="Take profit price"
            />
            {showTpPctPanel ? (
              <div className="mt-1.5 space-y-1.5 rounded-xl border border-white/[0.07] bg-black/35 px-2.5 py-2 ring-1 ring-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">
                      % from {pctBasisHeaderText(tpPercentBasis, entryBasisUi)} (favorable)
                    </span>
                    <div className="inline-flex flex-wrap rounded-md border border-white/[0.08] bg-black/30 p-0.5">
                      {(market === 'futures' ? FUTURES_SL_TP_PCT_BASES : SPOT_SL_TP_PCT_BASES).map((basis) => {
                        const active = tpPercentBasis === basis;
                        return (
                          <button
                            key={basis}
                            type="button"
                            onClick={() => setTpPercentBasis(basis)}
                            className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] transition ${
                              active
                                ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/30'
                                : 'text-sigflo-muted hover:text-sigflo-text'
                            }`}
                            title={pctBasisTooltip(basis, market, slTpEntryChip)}
                          >
                            {pctBasisChipText(basis, entryChipLabel)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <span
                    className={`text-[12px] font-bold tabular-nums ${tpEnabled ? 'text-emerald-200' : 'text-sigflo-muted'}`}
                  >
                    {tpEnabled ? `+${fmtPctCompact(tpSliderPct)}%` : '—'}
                  </span>
                </div>
                {entryNum != null ? (
                  <p className="text-[7px] font-mono tabular-nums leading-tight text-sigflo-muted/85">
                    {slTpEntryChip === 'avg' ? 'Avg' : 'Entry'} ${formatQuoteNumber(entryNum)}
                  </p>
                ) : null}
                {tpAwaitingMsg ? (
                  <p className="text-[7px] leading-snug text-amber-200/85">{tpAwaitingMsg}</p>
                ) : null}
                <div className="relative w-full">
                  <input
                    type="range"
                    min={0}
                    max={LEVEL_SLIDER_STEPS}
                    step={1}
                    disabled={!tpEnabled || tpReferencePrice == null}
                    value={tpSliderLinearSteps}
                    aria-label={`Take profit percent from ${pctBasisHeaderText(tpPercentBasis, entryBasisUi)} on favorable side`}
                    onChange={(e) => {
                      const rawPct = tpPctFromLinearSteps(Number(e.target.value));
                      const pct = nearestSnapPct(rawPct, TP_SNAP_PCTS);
                      if (tpReferencePrice == null || !onTakeProfitInputChange) return;
                      setTpEnabled(true);
                      onTakeProfitInputChange(
                        formatQuoteNumber(takeProfitPriceFromBps(tpReferencePrice, side, distancePctToBps(pct))),
                      );
                    }}
                    className="sigflo-level-slider sigflo-level-slider--emerald relative z-[1] w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <div
                    className="pointer-events-none relative mt-px h-1.5 w-full shrink-0"
                    aria-hidden
                  >
                    {TP_SNAP_PCTS.map((pct, i) => {
                      const norm = tpChipLayoutNorm(i);
                      return (
                        <span
                          key={`tp-tick-${pct}`}
                          className="pointer-events-none"
                          style={levelThumbAlignedStyle(norm, 'tickBelow')}
                        />
                      );
                    })}
                  </div>
                  <div className="relative z-[1] mt-1 h-5 w-full">
                    {TP_SNAP_PCTS.map((pct, i) => {
                      const on = tpEnabled && tpSliderPct === pct;
                      const norm = tpChipLayoutNorm(i);
                      return (
                        <button
                          key={`tp-m-${pct}`}
                          type="button"
                          disabled={tpReferencePrice == null}
                          onClick={() => {
                            if (tpReferencePrice == null || !onTakeProfitInputChange) return;
                            setTpEnabled(true);
                            onTakeProfitInputChange(
                              formatQuoteNumber(takeProfitPriceFromBps(tpReferencePrice, side, distancePctToBps(pct))),
                            );
                          }}
                          title={`${pct}% favorable`}
                          style={levelThumbAlignedStyle(norm)}
                          className={`absolute top-0 max-w-[2.25rem] truncate text-center text-[6.5px] font-bold tabular-nums leading-none transition sm:text-[7px] ${
                            on ? 'text-emerald-200' : 'text-sigflo-muted/75 hover:text-emerald-100/90'
                          } disabled:pointer-events-none disabled:opacity-35`}
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between text-[8px] font-medium tabular-nums text-sigflo-muted/75">
                  <span>
                    {TP_PCT_SLIDER_MIN}% ({pctBasisHeaderText(tpPercentBasis, entryBasisUi)})
                  </span>
                  <span>{TP_PCT_SLIDER_MAX}%</span>
                </div>
              </div>
            ) : tpPctHint != null && Number.isFinite(tpPctHint) ? (
              <p
                className={`mt-1 text-[9px] font-semibold tabular-nums leading-none ${tpPctHint >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                {tpPctHint >= 0 ? '+' : ''}
                {tpPctHint.toFixed(2)}%
              </p>
            ) : null}
            {onPartialPositionScaleOut ? (
              <div
                className="mt-2 space-y-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-2 ring-1 ring-emerald-400/10"
                role="group"
                aria-label="Partial take profit — scale out a fraction of the open exchange position"
              >
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-emerald-200/85">
                  Partial take profit
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {PARTIAL_POSITION_TP_PCTS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      disabled={partialPositionScaleOutBusy}
                      onClick={() => onPartialPositionScaleOut(pct / 100)}
                      aria-label={`Scale out ${pct} percent of open position`}
                      className="flex min-h-[32px] items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-1 text-center text-[10px] font-bold tabular-nums text-emerald-50 transition hover:border-emerald-300/50 hover:bg-emerald-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <p className="text-[8px] leading-snug text-sigflo-muted/90">
                  Same execution as the chart dock partial close.
                </p>
              </div>
            ) : null}
          </div>
        </div>
        </div>
      ) : null}

      {compactStats ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-black/30 p-2 sm:grid-cols-4">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Margin</p>
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-white">{moneyTight(compactStats.marginUsd)}</p>
          </div>
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Est. fee</p>
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-white">
              {moneyTight(compactStats.estFeeUsd)}
              {feePctOfNotional > 0 ? (
                <span className="block text-[9px] font-normal text-sigflo-muted">({feePctOfNotional.toFixed(2)}%)</span>
              ) : null}
            </p>
          </div>
          <div
            className={
              compactStats.liquidationPrice != null
                ? 'rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-1.5 py-1 ring-1 ring-amber-400/10'
                : ''
            }
          >
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Liquidation</p>
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-amber-200">
              {compactStats.liquidationPrice != null ? `$${formatQuoteNumber(compactStats.liquidationPrice)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Risk level</p>
            {compactStats.riskLevel != null && compactStats.riskMeterPct != null ? (
              <>
                <p className={`mt-0.5 text-[11px] font-bold ${riskColor}`}>{compactStats.riskLevel}</p>
                <RiskSegmentMeter pct={compactStats.riskMeterPct} level={compactStats.riskLevel} />
              </>
            ) : (
              <p className={`mt-0.5 text-[11px] font-bold ${riskColor}`}>{liquidationRisk}</p>
            )}
          </div>
        </div>
      ) : null}

      {lockSide ? (
        <div className="flex justify-center pt-0.5">
          <span
            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider ${
              side === 'long' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {side === 'long' ? 'LONG' : 'SHORT'} · open leg
          </span>
        </div>
      ) : showSideToggle ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSideChange('long')}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${
              side === 'long' ? 'bg-sigflo-accent text-sigflo-bg' : 'border border-white/[0.08] text-sigflo-text'
            }`}
          >
            {market === 'spot' ? 'Buy' : 'Open Long'}
          </button>
          <button
            type="button"
            onClick={() => onSideChange('short')}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${
              side === 'short' ? 'bg-rose-500 text-white' : 'border border-white/[0.08] text-sigflo-text'
            }`}
          >
            {market === 'spot' ? 'Sell' : 'Open Short'}
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px]">
        <span className="text-sigflo-muted">
          {money(positionSizeUsd)} · {walletUsedPct.toFixed(1)}% of wallet
        </span>
        {hideLiquidationFooter || compactStats?.riskMeterPct != null ? null : (
          <span className={`font-semibold ${riskColor}`}>Liq risk: {liquidationRisk}</span>
        )}
      </div>

      {assetTransferHref && transferModalOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default border-0 bg-black/75 p-0 backdrop-blur-[1px]"
            aria-label="Close"
            onClick={() => setTransferModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-dialog-title"
            className="relative z-[1] w-full max-w-sm rounded-xl border border-white/[0.12] bg-[#0a0a0c] p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.95)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="transfer-dialog-title" className="text-sm font-bold text-white">
              Transfer on Bybit
            </p>
            <p className="mt-2 text-[11px] leading-snug text-sigflo-muted">
              Sigflo cannot move funds for you. On Bybit, use <span className="font-semibold text-sigflo-text/90">Transfer</span>{' '}
              between <span className="text-sigflo-text/90">Funding</span> and your{' '}
              <span className="text-sigflo-text/90">Unified Trading Account</span>.
            </p>
            <p className="mt-2 text-[10px] leading-snug text-sigflo-muted/90">
              If Bybit opens the chart instead, use the menu → <span className="text-white/85">Assets</span> →{' '}
              <span className="text-white/85">Transfer</span>.
            </p>
            <p className="mt-2 text-[9px] leading-snug text-sigflo-muted/80">
              Links go straight to Bybit’s site — Sigflo can’t pass your login through (and never sees your Bybit
              password). You’ll only skip sign-in if{' '}
              <span className="text-sigflo-muted">this same browser</span> already has an active Bybit web session.
              In-app or embedded browsers often use a separate cookie store; open the link in Chrome/Edge/Safari if
              Bybit asks you to log in again.
            </p>
            <p className="mt-1.5 text-[9px] leading-snug text-sigflo-muted/75">
              Bybit changes routes often; if one link 404s, try the other. Help always loads.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={BYBIT_APP_ASSETS_HOME_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center justify-center rounded-lg bg-[#00ffc8]/15 text-center text-[12px] font-bold text-[#00ffc8] ring-1 ring-[#00ffc8]/35 transition hover:bg-[#00ffc8]/22"
              >
                Open Assets (Bybit app)
              </a>
              <a
                href={BYBIT_USER_ASSETS_EXCHANGE_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[40px] items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-center text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.07]"
              >
                Alternate assets page
              </a>
              <a
                href={BYBIT_TRANSFER_HELP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-[11px] font-semibold text-sigflo-muted underline decoration-white/20 underline-offset-2 hover:text-white/85"
              >
                How to transfer (Bybit Help — always works)
              </a>
            </div>
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="mt-4 w-full rounded-lg border border-white/[0.08] py-2 text-[11px] font-semibold text-sigflo-muted transition hover:bg-white/[0.04] hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
