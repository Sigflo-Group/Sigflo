"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradeTimingLineAlpha = tradeTimingLineAlpha;
exports.tradeTimingOverlayVisual = tradeTimingOverlayVisual;
exports.blendTimingReadinessScore = blendTimingReadinessScore;
exports.tradeTimingChipProps = tradeTimingChipProps;
/** Alpha and line emphasis for chart trade overlays (entry / stop / target) from timing state. */
/** Chart overlay line opacity from `tradeTimingOverlayVisual` — floored so entry/target stay readable when timing is “invalid”. */
function tradeTimingLineAlpha(level, timingAlphaScale) {
    var a = timingAlphaScale;
    if (level === 'stop' || level === 'liquidation') {
        return Math.max(0.42, a);
    }
    return Math.max(0.35, a);
}
function tradeTimingOverlayVisual(state) {
    switch (state) {
        case 'early':
            return { alphaScale: 0.4, entryLineExtraWidth: 0 };
        case 'developing':
            return { alphaScale: 0.7, entryLineExtraWidth: 0 };
        case 'ready':
            return { alphaScale: 1, entryLineExtraWidth: 1 };
        case 'invalid':
            return { alphaScale: 0.14, entryLineExtraWidth: 0 };
        default:
            return { alphaScale: 1, entryLineExtraWidth: 0 };
    }
}
/** 0–100 readiness used for timing chip thresholds — matches entry guidance weighting. */
function blendTimingReadinessScore(setupScore, tradeScore) {
    return setupScore * 0.45 + tradeScore * 0.55;
}
function timingReadiness(tradeScore, setupScore) {
    if (setupScore != null && Number.isFinite(setupScore)) {
        return blendTimingReadinessScore(setupScore, tradeScore);
    }
    return tradeScore;
}
/**
 * How much row-level scanner scores can move the timing readiness vs signal `baseReadiness`.
 * Weak base → almost no scanner lift; decent base → scanner can boost more (feels natural vs a fixed blend).
 */
function scannerReadinessBlendWeight(baseReadiness) {
    var b = Math.max(0, Math.min(100, baseReadiness));
    if (b <= 44)
        return 0.05;
    if (b >= 72)
        return 0.36;
    return 0.05 + ((b - 44) / (72 - 44)) * (0.36 - 0.05);
}
/** Do not show “Ready” when trade score is this low, even if blended readiness clears the bar (scanner optimism). */
var READY_MIN_TRADE_SCORE = 50;
/**
 * Legacy timing chip from scanner row + blended readiness (can label triggered rows “Weak timing”).
 * Trade screen / dock / scanner card use {@link buildTradeTimingUiModel} instead — setup vs execution split.
 */
function tradeTimingChipProps(status, tradeScore, setupScore, scannerTiming) {
    var scannerTimingScore = scannerTiming === null || scannerTiming === void 0 ? void 0 : scannerTiming.timingScore;
    var scannerFreshness = scannerTiming === null || scannerTiming === void 0 ? void 0 : scannerTiming.entryFreshnessScore;
    var scannerActionability = scannerTiming === null || scannerTiming === void 0 ? void 0 : scannerTiming.actionabilityScore;
    var hasScannerReadiness = Number.isFinite(scannerTimingScore) ||
        Number.isFinite(scannerFreshness) ||
        Number.isFinite(scannerActionability);
    var scannerReadiness = Math.round((Number.isFinite(scannerActionability) ? scannerActionability * 0.5 : 0) +
        (Number.isFinite(scannerTimingScore) ? scannerTimingScore * 0.3 : 0) +
        (Number.isFinite(scannerFreshness) ? scannerFreshness * 0.2 : 0));
    var baseReadiness = timingReadiness(tradeScore, setupScore);
    var w = hasScannerReadiness ? scannerReadinessBlendWeight(baseReadiness) : 0;
    var readiness = hasScannerReadiness
        ? Math.round(w * scannerReadiness + (1 - w) * baseReadiness)
        : baseReadiness;
    var effectiveStatus = status;
    if (hasScannerReadiness && status === 'idle') {
        // Lifecycle scores can stay valid while row status briefly churns to idle during refresh/merge.
        if ((scannerActionability !== null && scannerActionability !== void 0 ? scannerActionability : 0) >= 64)
            effectiveStatus = 'triggered';
        else if ((scannerTimingScore !== null && scannerTimingScore !== void 0 ? scannerTimingScore : 0) >= 52 || (scannerFreshness !== null && scannerFreshness !== void 0 ? scannerFreshness : 0) >= 52)
            effectiveStatus = 'developing';
    }
    if (effectiveStatus === 'overextended' || effectiveStatus === 'extended') {
        return {
            state: 'invalid',
            label: effectiveStatus === 'extended' ? 'Late setup' : 'Stretched',
        };
    }
    if (effectiveStatus === 'developing')
        return { state: 'developing', label: 'Developing' };
    if (effectiveStatus === 'triggered' &&
        readiness >= 62 &&
        tradeScore >= READY_MIN_TRADE_SCORE) {
        return { state: 'ready', label: 'Ready' };
    }
    if (effectiveStatus === 'triggered' && readiness < 42)
        return { state: 'invalid', label: 'Weak timing' };
    if (effectiveStatus === 'triggered' && readiness < 50)
        return { state: 'invalid', label: 'Too late' };
    if (effectiveStatus === 'triggered')
        return { state: 'developing', label: 'Developing' };
    if (effectiveStatus === 'idle')
        return { state: 'early', label: 'Too early' };
    return { state: 'early', label: 'Too early' };
}
