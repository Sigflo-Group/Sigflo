import type {
  ExecutionQuality,
  RiskLevel,
  RiskSummary,
  SetupDisplayState,
  TradeSide,
  TradeViewModel,
} from '@/types/trade';

export interface TradeInputs {
  amountUsd: number;
  leverage: number;
  side: TradeSide;
  market: 'futures' | 'spot';
  setupScore: number;
  /** Subtracted from base trade score after risk/setup math (execution fill quality). */
  executionTradeScorePenalty?: number;
  executionQuality?: ExecutionQuality | null;
  setupDisplayState?: SetupDisplayState;
}

export interface DerivedTradeMetrics {
  balanceUsd: number;
  amountUsedUsd: number;
  leverage: number;
  positionSizeUsd: number;
  targetProfitUsd: number;
  stopLossUsd: number;
  liquidation: number;
  walletUsedPct: number;
  liquidationRisk: RiskLevel;
  riskSummary: RiskSummary;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function getRiskLevel(walletUsedPct: number, leverage: number, liquidationBufferPct: number): RiskLevel {
  if (walletUsedPct > 35 || leverage > 20 || liquidationBufferPct < 6) return 'High';
  if (walletUsedPct > 20 || leverage > 12 || liquidationBufferPct < 10) return 'Medium';
  return 'Low';
}

function getWalletImpactLabel(walletUsedPct: number): string {
  if (walletUsedPct > 30) return 'Heavy';
  if (walletUsedPct > 20) return 'Above average';
  if (walletUsedPct > 10) return 'Moderate';
  return 'Light';
}

function getPrimaryWarning(
  walletUsedPct: number,
  leverage: number,
  riskLevel: RiskLevel,
  setupScore: number,
  oversizingRelativeToSetup: boolean,
): string {
  if (oversizingRelativeToSetup && setupScore >= 70) {
    return 'Position sizing increases exposure.';
  }
  if (oversizingRelativeToSetup && setupScore < 70) {
    return 'Position sizing is aggressive for this setup.';
  }
  if (setupScore < 70 && leverage > 12) {
    return 'Setup quality is moderate, so high leverage is harder to justify.';
  }
  if (riskLevel === 'High' || walletUsedPct > 30 || leverage > 20) {
    return 'This trade risks a large portion of your wallet.';
  }
  if (riskLevel === 'Medium' || walletUsedPct > 20) {
    return 'This trade uses more capital than your average.';
  }
  return 'Risk is controlled at this size.';
}

/**
 * Explains how {@link getTradeScore} was derived — use while tuning (e.g. `console.debug(getTradeScoreBreakdown(...))`).
 * Not wired into UI; safe to call from devtools or temporary logging.
 */
export type TradeScoreBreakdown = {
  /** Neutral anchor before setup lift and penalties (not shown as a separate “base” in the formula comment below). */
  baseScore: number;
  /** Primary positive driver: better setup raises the score more than before. */
  setupContribution: number;
  /** Wallet usage drag — softened vs older formula so typical sizing does not dominate. */
  walletPenalty: number;
  /** Leverage drag — softened so moderate leverage is not harshly punished. */
  leveragePenalty: number;
  /** Tight liq buffer still hurts, but tier penalties are smaller than the old blunt values. */
  liquidationPenalty: number;
  /** Aggregate risk band (wallet + lev + liq context) — meaningful but not score-crushing by default. */
  riskPenalty: number;
  /** Extra hit when size exceeds setup-adjusted recommended usage. */
  oversizePenalty: number;
  /** Sum before clamp (unrounded). */
  rawScore: number;
  /** Rounded, clamped to [5, 98]. */
  finalScore: number;
};

/**
 * **Trade quality adjusted for risk and execution discipline** — not a pure “position aggressiveness” penalty.
 * Setup quality is the main lift; wallet, leverage, liquidation buffer, risk band, and oversize are moderating penalties
 * that should bite hardest only when several stack together (genuinely reckless profiles).
 */
export function getTradeScoreBreakdown(
  walletUsedPct: number,
  leverage: number,
  riskLevel: RiskLevel,
  setupScore: number,
  oversizingRelativeToSetup: boolean,
  liquidationBufferPct: number,
): TradeScoreBreakdown {
  const baseScore = 55;
  // Setup is the primary positive driver (reference point 50, steeper slope than the old 60 / 0.55 curve).
  const setupContribution = (setupScore - 50) * 0.9;
  // Moderating penalties — softer than the legacy model so a decent setup + moderate risk does not collapse toward the floor.
  const walletPenalty = walletUsedPct * 0.35;
  const leveragePenalty = Math.max(0, leverage - 1) * 0.9;
  const liquidationPenalty = liquidationBufferPct < 6 ? 12 : liquidationBufferPct < 10 ? 6 : 0;
  const riskPenalty = riskLevel === 'High' ? 12 : riskLevel === 'Medium' ? 5 : 0;
  const oversizePenalty = oversizingRelativeToSetup ? 8 : 0;

  const rawScore =
    baseScore +
    setupContribution -
    walletPenalty -
    leveragePenalty -
    liquidationPenalty -
    riskPenalty -
    oversizePenalty;
  const finalScore = Math.round(clamp(rawScore, 5, 98));

  return {
    baseScore,
    setupContribution,
    walletPenalty,
    leveragePenalty,
    liquidationPenalty,
    riskPenalty,
    oversizePenalty,
    rawScore,
    finalScore,
  };
}

function getTradeScore(
  walletUsedPct: number,
  leverage: number,
  riskLevel: RiskLevel,
  setupScore: number,
  oversizingRelativeToSetup: boolean,
  liquidationBufferPct: number,
): number {
  return getTradeScoreBreakdown(
    walletUsedPct,
    leverage,
    riskLevel,
    setupScore,
    oversizingRelativeToSetup,
    liquidationBufferPct,
  ).finalScore;
}

export function deriveTradeMetrics(model: TradeViewModel, inputs: TradeInputs): DerivedTradeMetrics {
  const amountUsedUsd = clamp(inputs.amountUsd, 0, model.balanceUsd);
  const leverage = clamp(inputs.leverage, 1, 200);
  const positionSizeUsd = amountUsedUsd * leverage;
  const walletUsedPct = model.balanceUsd > 0 ? (amountUsedUsd / model.balanceUsd) * 100 : 0;

  const targetMovePct = Math.abs((model.target - model.entry) / model.entry);
  const stopMovePct = Math.abs((model.stop - model.entry) / model.entry);
  const targetProfitUsd = positionSizeUsd * targetMovePct;
  const stopLossUsd = -(positionSizeUsd * stopMovePct);

  const liqDistance = (1 / leverage) * 0.9;
  const liquidation =
    inputs.side === 'long' ? model.entry * (1 - liqDistance) : model.entry * (1 + liqDistance);
  const liquidationBufferPct = Math.abs((model.entry - liquidation) / model.entry) * 100;

  const recommendedUsagePct = clamp(8 + (inputs.setupScore - 40) * 0.25, 8, 22);
  const oversizingRelativeToSetup = walletUsedPct > recommendedUsagePct;
  const liquidationRisk = getRiskLevel(walletUsedPct, leverage, liquidationBufferPct);
  const walletImpactLabel = getWalletImpactLabel(walletUsedPct);
  const primaryMessage = getPrimaryWarning(
    walletUsedPct,
    leverage,
    liquidationRisk,
    inputs.setupScore,
    oversizingRelativeToSetup,
  );
  const baseTradeScore = getTradeScore(
    walletUsedPct,
    leverage,
    liquidationRisk,
    inputs.setupScore,
    oversizingRelativeToSetup,
    liquidationBufferPct,
  );
  const executionPenalty = Math.max(0, inputs.executionTradeScorePenalty ?? 0);
  const tradeScore = Math.round(clamp(baseTradeScore - executionPenalty, 5, 98));
  const setupTradeConflictMessage =
    inputs.setupScore >= 70 && tradeScore < 65
      ? 'The setup is strong, but this position reduces trade quality.'
      : undefined;
  const riskMeterPct = Math.round(
    clamp(
      walletUsedPct * 1.3 +
        Math.max(0, leverage - 1) * 1.9 +
        (liquidationBufferPct < 10 ? 10 : 0) +
        (oversizingRelativeToSetup ? 10 : 0),
      2,
      100,
    ),
  );
  /** Supplementary bullets only — `primaryMessage` is shown separately in the UI. */
  const warnings: string[] = [];
  if (walletUsedPct > 20) warnings.push(`Wallet impact is ${walletUsedPct.toFixed(1)}% of available balance.`);
  if (oversizingRelativeToSetup) warnings.push(`Sizing exceeds setup-adjusted range (${recommendedUsagePct.toFixed(1)}%).`);
  if (leverage > 20) warnings.push('Leverage is above the safer operating range for this setup.');
  if (liquidationRisk === 'High') warnings.push('Liquidation sensitivity is elevated at the current size.');

  return {
    balanceUsd: model.balanceUsd,
    amountUsedUsd,
    leverage,
    positionSizeUsd,
    targetProfitUsd,
    stopLossUsd,
    liquidation,
    walletUsedPct,
    liquidationRisk,
    riskSummary: {
      setupScore: inputs.setupScore,
      positionSizeUsd,
      walletUsedPct,
      recommendedUsagePct,
      oversizingRelativeToSetup,
      liquidationBufferPct,
      liquidationRisk,
      riskMeterPct,
      tradeScore,
      setupDisplayState: inputs.setupDisplayState,
      executionQuality: inputs.executionQuality ?? null,
      executionPenaltyApplied: executionPenalty > 0 ? executionPenalty : undefined,
      setupTradeConflictMessage,
      walletImpactLabel,
      primaryMessage,
      warnings,
    },
  };
}
