type PositionRoeInput = {
  size: number;
  entryPrice: number;
  markPrice?: number;
  leverage?: number | string;
  positionIM?: number | string;
};

type PositionLivePnlInput = PositionRoeInput & {
  side: 'long' | 'short';
  unrealizedPnl?: number;
};

const MAX_REASONABLE_LINEAR_LEVERAGE = 200;
const ROE_DIVERGENCE_RATIO_MAX = 8;
const ROE_DIVERGENCE_RATIO_MIN = 1 / ROE_DIVERGENCE_RATIO_MAX;
const MIN_MOVE_PCT_FOR_DIVERGENCE_CHECK = 0.05;

function parseNumericLike(n: unknown): number | null {
  if (typeof n === 'number') return Number.isFinite(n) ? n : null;
  if (typeof n !== 'string') return null;
  const trimmed = n.trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/,/g, '');
  const strict = Number(compact);
  if (Number.isFinite(strict)) return strict;
  const prefix = compact.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
  if (!prefix) return null;
  const parsed = Number(prefix[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function finitePositive(n: unknown): number | null {
  const parsed = parseNumericLike(n);
  if (parsed == null || parsed <= 0) return null;
  return parsed;
}

function finiteNumber(n: unknown): number | null {
  return parseNumericLike(n);
}

/** Entry-based notional for linear contracts; falls back to mark only when entry is unavailable. */
export function entryNotionalUsd(input: Pick<PositionRoeInput, 'size' | 'entryPrice' | 'markPrice'>): number {
  const entry = finitePositive(input.entryPrice);
  const mark = finitePositive(input.markPrice);
  const px = entry ?? mark ?? 0;
  return Math.abs(input.size) * px;
}

/**
 * Returns the margin base used for ROE/PnL%.
 * Guardrail: ignore unrealistically small positionIM values for linear contracts,
 * because some account modes can report tiny IM values that explode % returns.
 */
export function marginBaseForRoe(input: PositionRoeInput): number | null {
  const notional = entryNotionalUsd(input);
  if (!Number.isFinite(notional) || notional <= 0) {
    return finitePositive(input.positionIM);
  }

  const levRaw = finitePositive(input.leverage);
  const lev = levRaw != null ? Math.min(MAX_REASONABLE_LINEAR_LEVERAGE, Math.max(1, levRaw)) : null;
  const marginFromLeverage = lev != null ? notional / lev : null;
  const minPlausibleMargin = notional / MAX_REASONABLE_LINEAR_LEVERAGE;
  const positionIm = finitePositive(input.positionIM);
  const positionImImplausiblyTiny = positionIm != null && positionIm < minPlausibleMargin * 0.98;

  if (positionIm != null && !positionImImplausiblyTiny) {
    return positionIm;
  }
  if (marginFromLeverage != null && marginFromLeverage > 0) {
    return marginFromLeverage;
  }
  // If IM fails plausibility and no leverage fallback exists, avoid returning the tiny
  // raw IM value because it can inflate PnL% into nonsense territory.
  if (positionImImplausiblyTiny) {
    return notional;
  }
  if (positionIm != null) {
    return positionIm;
  }
  return notional;
}

/**
 * Compute live PnL% with guardrails:
 * - primary path: pnl / marginBaseForRoe
 * - fallback path: leverage-adjusted price move (%), which is resilient to contract-size mismatches
 * If both are available but diverge by an extreme ratio, prefer leverage-based move.
 */
export function livePnlPercent(input: PositionLivePnlInput): number {
  const pnlUsd = finiteNumber(input.unrealizedPnl) ?? 0;
  const margin = marginBaseForRoe(input);
  const marginPct = margin != null && margin > 0 ? (pnlUsd / margin) * 100 : null;

  const entry = finitePositive(input.entryPrice);
  const mark = finitePositive(input.markPrice);
  const levRaw = finitePositive(input.leverage);
  const lev = levRaw != null ? Math.min(MAX_REASONABLE_LINEAR_LEVERAGE, Math.max(1, levRaw)) : null;
  const leveragedMovePct =
    entry != null && mark != null && lev != null
      ? (((input.side === 'short' ? entry - mark : mark - entry) / entry) * lev * 100)
      : null;

  if (leveragedMovePct == null) return marginPct ?? 0;
  if (marginPct == null || !Number.isFinite(marginPct)) return leveragedMovePct;

  const absLevMove = Math.abs(leveragedMovePct);
  if (absLevMove < MIN_MOVE_PCT_FOR_DIVERGENCE_CHECK) return marginPct;

  const absMargin = Math.abs(marginPct);
  const ratio = absMargin / absLevMove;
  if (ratio > ROE_DIVERGENCE_RATIO_MAX || ratio < ROE_DIVERGENCE_RATIO_MIN) {
    return leveragedMovePct;
  }
  return marginPct;
}
