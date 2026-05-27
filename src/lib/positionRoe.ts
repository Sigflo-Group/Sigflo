type PositionRoeInput = {
  size: number;
  entryPrice: number;
  markPrice?: number;
  leverage?: number | string;
  positionIM?: number | string;
};

const MAX_REASONABLE_LINEAR_LEVERAGE = 200;

function finitePositive(n: unknown): number | null {
  if (typeof n === 'number') {
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }
  if (typeof n === 'string') {
    const trimmed = n.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }
  return null;
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

  if (positionIm != null && positionIm >= minPlausibleMargin * 0.98) {
    return positionIm;
  }
  if (marginFromLeverage != null && marginFromLeverage > 0) {
    return marginFromLeverage;
  }
  if (positionIm != null) {
    return positionIm;
  }
  return notional;
}
