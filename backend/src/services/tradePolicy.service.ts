export type TradePolicyInput = {
  symbol: string;
  direction: 'long' | 'short';
  positionSizeUsd: number;
  leverage: number;
  stopPrice?: number;
  targetPrice?: number;
};

export function validateTradePolicy(input: TradePolicyInput): { ok: true } | { ok: false; reason: string } {
  if (!/^[A-Z0-9/_-]{3,32}$/i.test(input.symbol)) return { ok: false, reason: 'Invalid symbol' };
  if (!(input.positionSizeUsd > 0) || input.positionSizeUsd > 5_000_000) return { ok: false, reason: 'Invalid position size' };
  if (!(input.leverage >= 1) || input.leverage > 125) return { ok: false, reason: 'Invalid leverage' };
  if (input.stopPrice != null && input.targetPrice != null) {
    if (input.direction === 'long' && !(input.stopPrice < input.targetPrice)) return { ok: false, reason: 'Invalid stop/target relationship' };
    if (input.direction === 'short' && !(input.stopPrice > input.targetPrice)) return { ok: false, reason: 'Invalid stop/target relationship' };
  }
  return { ok: true };
}

export function computeRiskSummary(input: TradePolicyInput) {
  const estimatedMarginUsd = input.positionSizeUsd / Math.max(1, input.leverage);
  // R:R uses entryPrice when available, but at intent-creation time entryPrice
  // is not yet known. Omit the ratio rather than compute a misleading value.
  const riskRewardRatio = 0;
  return {
    estimatedMarginUsd,
    liquidationBufferPct: 0,
    riskRewardRatio,
  };
}
