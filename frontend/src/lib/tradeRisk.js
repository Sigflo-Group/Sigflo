"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTradeScoreBreakdown = getTradeScoreBreakdown;
exports.deriveTradeMetrics = deriveTradeMetrics;
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function getRiskLevel(walletUsedPct, leverage, liquidationBufferPct) {
    if (walletUsedPct > 35 || leverage > 20 || liquidationBufferPct < 6)
        return 'High';
    if (walletUsedPct > 20 || leverage > 12 || liquidationBufferPct < 10)
        return 'Medium';
    return 'Low';
}
function getWalletImpactLabel(walletUsedPct) {
    if (walletUsedPct > 30)
        return 'Heavy';
    if (walletUsedPct > 20)
        return 'Above average';
    if (walletUsedPct > 10)
        return 'Moderate';
    return 'Light';
}
function getPrimaryWarning(walletUsedPct, leverage, riskLevel, setupScore, oversizingRelativeToSetup) {
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
 * **Trade quality adjusted for risk and execution discipline** — not a pure “position aggressiveness” penalty.
 * Setup quality is the main lift; wallet, leverage, liquidation buffer, risk band, and oversize are moderating penalties
 * that should bite hardest only when several stack together (genuinely reckless profiles).
 */
function getTradeScoreBreakdown(walletUsedPct, leverage, riskLevel, setupScore, oversizingRelativeToSetup, liquidationBufferPct) {
    var baseScore = 55;
    // Setup is the primary positive driver (reference point 50, steeper slope than the old 60 / 0.55 curve).
    var setupContribution = (setupScore - 50) * 0.9;
    // Moderating penalties — softer than the legacy model so a decent setup + moderate risk does not collapse toward the floor.
    var walletPenalty = walletUsedPct * 0.35;
    var leveragePenalty = Math.max(0, leverage - 1) * 0.9;
    var liquidationPenalty = liquidationBufferPct < 6 ? 12 : liquidationBufferPct < 10 ? 6 : 0;
    var riskPenalty = riskLevel === 'High' ? 12 : riskLevel === 'Medium' ? 5 : 0;
    var oversizePenalty = oversizingRelativeToSetup ? 8 : 0;
    var rawScore = baseScore +
        setupContribution -
        walletPenalty -
        leveragePenalty -
        liquidationPenalty -
        riskPenalty -
        oversizePenalty;
    var finalScore = Math.round(clamp(rawScore, 5, 98));
    return {
        baseScore: baseScore,
        setupContribution: setupContribution,
        walletPenalty: walletPenalty,
        leveragePenalty: leveragePenalty,
        liquidationPenalty: liquidationPenalty,
        riskPenalty: riskPenalty,
        oversizePenalty: oversizePenalty,
        rawScore: rawScore,
        finalScore: finalScore,
    };
}
function getTradeScore(walletUsedPct, leverage, riskLevel, setupScore, oversizingRelativeToSetup, liquidationBufferPct) {
    return getTradeScoreBreakdown(walletUsedPct, leverage, riskLevel, setupScore, oversizingRelativeToSetup, liquidationBufferPct).finalScore;
}
function deriveTradeMetrics(model, inputs) {
    var _a, _b;
    var amountUsedUsd = clamp(inputs.amountUsd, 0, model.balanceUsd);
    var leverage = clamp(inputs.leverage, 1, 200);
    var positionSizeUsd = amountUsedUsd * leverage;
    var walletUsedPct = model.balanceUsd > 0 ? (amountUsedUsd / model.balanceUsd) * 100 : 0;
    var targetMovePct = Math.abs((model.target - model.entry) / model.entry);
    var stopMovePct = Math.abs((model.stop - model.entry) / model.entry);
    var targetProfitUsd = positionSizeUsd * targetMovePct;
    var stopLossUsd = -(positionSizeUsd * stopMovePct);
    var liqDistance = (1 / leverage) * 0.9;
    var liquidation = inputs.side === 'long' ? model.entry * (1 - liqDistance) : model.entry * (1 + liqDistance);
    var liquidationBufferPct = Math.abs((model.entry - liquidation) / model.entry) * 100;
    var recommendedUsagePct = clamp(8 + (inputs.setupScore - 40) * 0.25, 8, 22);
    var oversizingRelativeToSetup = walletUsedPct > recommendedUsagePct;
    var liquidationRisk = getRiskLevel(walletUsedPct, leverage, liquidationBufferPct);
    var walletImpactLabel = getWalletImpactLabel(walletUsedPct);
    var primaryMessage = getPrimaryWarning(walletUsedPct, leverage, liquidationRisk, inputs.setupScore, oversizingRelativeToSetup);
    var baseTradeScore = getTradeScore(walletUsedPct, leverage, liquidationRisk, inputs.setupScore, oversizingRelativeToSetup, liquidationBufferPct);
    var executionPenalty = Math.max(0, (_a = inputs.executionTradeScorePenalty) !== null && _a !== void 0 ? _a : 0);
    var tradeScore = Math.round(clamp(baseTradeScore - executionPenalty, 5, 98));
    var setupTradeConflictMessage = inputs.setupScore >= 70 && tradeScore < 65
        ? 'The setup is strong, but this position reduces trade quality.'
        : undefined;
    var riskMeterPct = Math.round(clamp(walletUsedPct * 1.3 +
        Math.max(0, leverage - 1) * 1.9 +
        (liquidationBufferPct < 10 ? 10 : 0) +
        (oversizingRelativeToSetup ? 10 : 0), 2, 100));
    /** Supplementary bullets only — `primaryMessage` is shown separately in the UI. */
    var warnings = [];
    if (walletUsedPct > 20)
        warnings.push("Wallet impact is ".concat(walletUsedPct.toFixed(1), "% of available balance."));
    if (oversizingRelativeToSetup)
        warnings.push("Sizing exceeds setup-adjusted range (".concat(recommendedUsagePct.toFixed(1), "%)."));
    if (leverage > 20)
        warnings.push('Leverage is above the safer operating range for this setup.');
    if (liquidationRisk === 'High')
        warnings.push('Liquidation sensitivity is elevated at the current size.');
    return {
        balanceUsd: model.balanceUsd,
        amountUsedUsd: amountUsedUsd,
        leverage: leverage,
        positionSizeUsd: positionSizeUsd,
        targetProfitUsd: targetProfitUsd,
        stopLossUsd: stopLossUsd,
        liquidation: liquidation,
        walletUsedPct: walletUsedPct,
        liquidationRisk: liquidationRisk,
        riskSummary: {
            setupScore: inputs.setupScore,
            positionSizeUsd: positionSizeUsd,
            walletUsedPct: walletUsedPct,
            recommendedUsagePct: recommendedUsagePct,
            oversizingRelativeToSetup: oversizingRelativeToSetup,
            liquidationBufferPct: liquidationBufferPct,
            liquidationRisk: liquidationRisk,
            riskMeterPct: riskMeterPct,
            tradeScore: tradeScore,
            setupDisplayState: inputs.setupDisplayState,
            executionQuality: (_b = inputs.executionQuality) !== null && _b !== void 0 ? _b : null,
            executionPenaltyApplied: executionPenalty > 0 ? executionPenalty : undefined,
            setupTradeConflictMessage: setupTradeConflictMessage,
            walletImpactLabel: walletImpactLabel,
            primaryMessage: primaryMessage,
            warnings: warnings,
        },
    };
}
