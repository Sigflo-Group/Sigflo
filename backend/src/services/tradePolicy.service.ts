export const MAX_MANAGED_POSITION_SIZE_USD = 5_000_000;
export const MAX_MANAGED_LEVERAGE = 125;

export type TradePolicyInput = {
  symbol: string;
  direction: 'long' | 'short';
  positionSizeUsd: number;
  leverage: number;
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
};

function isPositiveFinite(value: number | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

export function validateTradePolicy(input: TradePolicyInput): { ok: true } | { ok: false; reason: string } {
  if (!/^[A-Z0-9/_-]{3,32}$/i.test(input.symbol)) return { ok: false, reason: 'Invalid symbol' };
  if (!Number.isFinite(input.positionSizeUsd) || input.positionSizeUsd <= 0 || input.positionSizeUsd > MAX_MANAGED_POSITION_SIZE_USD) {
    return { ok: false, reason: 'Invalid position size' };
  }
  if (!Number.isFinite(input.leverage) || input.leverage < 1 || input.leverage > MAX_MANAGED_LEVERAGE) {
    return { ok: false, reason: 'Invalid leverage' };
  }

  if (input.entryPrice != null && !isPositiveFinite(input.entryPrice)) return { ok: false, reason: 'Invalid entry price' };
  if (input.stopPrice != null && !isPositiveFinite(input.stopPrice)) return { ok: false, reason: 'Invalid stop price' };
  if (input.targetPrice != null && !isPositiveFinite(input.targetPrice)) return { ok: false, reason: 'Invalid target price' };

  if (isPositiveFinite(input.entryPrice)) {
    if (isPositiveFinite(input.stopPrice)) {
      if (input.direction === 'long' && input.stopPrice >= input.entryPrice) {
        return { ok: false, reason: 'Long stop must be below entry' };
      }
      if (input.direction === 'short' && input.stopPrice <= input.entryPrice) {
        return { ok: false, reason: 'Short stop must be above entry' };
      }
    }
    if (isPositiveFinite(input.targetPrice)) {
      if (input.direction === 'long' && input.targetPrice <= input.entryPrice) {
        return { ok: false, reason: 'Long target must be above entry' };
      }
      if (input.direction === 'short' && input.targetPrice >= input.entryPrice) {
        return { ok: false, reason: 'Short target must be below entry' };
      }
    }
  }

  if (input.stopPrice != null && input.targetPrice != null) {
    if (input.direction === 'long' && !(input.stopPrice < input.targetPrice)) return { ok: false, reason: 'Invalid stop/target relationship' };
    if (input.direction === 'short' && !(input.stopPrice > input.targetPrice)) return { ok: false, reason: 'Invalid stop/target relationship' };
  }
  return { ok: true };
}

export function computeRiskSummary(input: TradePolicyInput) {
  const estimatedMarginUsd = input.positionSizeUsd / Math.max(1, input.leverage);
  let riskRewardRatio: number | null = null;
  let stopDistancePct: number | null = null;
  let targetDistancePct: number | null = null;

  if (isPositiveFinite(input.entryPrice)) {
    if (isPositiveFinite(input.stopPrice)) {
      stopDistancePct = (Math.abs(input.entryPrice - input.stopPrice) / input.entryPrice) * 100;
    }
    if (isPositiveFinite(input.targetPrice)) {
      targetDistancePct = (Math.abs(input.targetPrice - input.entryPrice) / input.entryPrice) * 100;
    }
    if (stopDistancePct != null && stopDistancePct > 0 && targetDistancePct != null) {
      riskRewardRatio = targetDistancePct / stopDistancePct;
    }
  }

  return {
    estimatedMarginUsd,
    // Exact liquidation distance is exchange/contract/margin-mode specific; null is safer than a fake zero.
    liquidationBufferPct: null,
    riskRewardRatio,
    stopDistancePct,
    targetDistancePct,
  };
}
