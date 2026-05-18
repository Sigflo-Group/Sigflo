"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSITION_BIAS_RUNNER_UP_GAP = exports.POSITION_BIAS_MIN_SETUP_SCORE = void 0;
exports.pickBestScannerSignalForSymbol = pickBestScannerSignalForSymbol;
exports.positionBiasForLinearSymbol = positionBiasForLinearSymbol;
exports.positionBiasForSignalRow = positionBiasForSignalRow;
var tradePairFavorites_1 = require("@/lib/tradePairFavorites");
/** Do not show strong Favorable/Counter when the scanner row is weak (reduces flip-flop). */
exports.POSITION_BIAS_MIN_SETUP_SCORE = 44;
/**
 * When two rows tie for the same pair, require this many `setupScore` points between #1 and #2
 * before we treat #1 as the definitive bias (Portfolio path only).
 */
exports.POSITION_BIAS_RUNNER_UP_GAP = 6;
function neutralMixedStat(biasLabel, reason) {
    var b = biasLabel.trim();
    return {
        variant: 'neutral',
        title: 'Mixed',
        subtitle: b ? "".concat(b, " \u00B7 ").concat(reason) : reason,
    };
}
function biasFromMatchedRow(positionSide, signal) {
    var aligned = positionSide === signal.side;
    var sub = signal.biasLabel.trim();
    return {
        variant: aligned ? 'aligned' : 'counter',
        title: aligned ? 'Favorable' : 'Counter',
        subtitle: sub || (aligned ? 'With scanner' : 'Against scanner'),
    };
}
function topTwoScannerSignalsForSymbol(signals, linearSymbol) {
    var _a;
    var want = (0, tradePairFavorites_1.normalizeTradePairBase)(linearSymbol);
    var matches = [];
    for (var _i = 0, signals_1 = signals; _i < signals_1.length; _i++) {
        var s = signals_1[_i];
        if ((0, tradePairFavorites_1.normalizeTradePairBase)(s.pair) !== want)
            continue;
        matches.push(s);
    }
    if (matches.length === 0)
        return [null, null];
    matches.sort(function (a, b) { return b.setupScore - a.setupScore; });
    return [matches[0], (_a = matches[1]) !== null && _a !== void 0 ? _a : null];
}
/**
 * Strongest scanner row for this contract (highest `setupScore` among rows whose pair base matches).
 */
function pickBestScannerSignalForSymbol(signals, linearSymbol) {
    var best = topTwoScannerSignalsForSymbol(signals, linearSymbol)[0];
    return best;
}
/**
 * Open leg vs best ranked scanner row for this linear symbol (Portfolio cards, etc.).
 * Buffers: minimum setup score + leader gap over the runner-up for the same pair.
 */
function positionBiasForLinearSymbol(linearSymbol, positionSide, signals) {
    var _a = topTwoScannerSignalsForSymbol(signals, linearSymbol), best = _a[0], second = _a[1];
    if (!best)
        return null;
    if (!Number.isFinite(best.setupScore) || best.setupScore < exports.POSITION_BIAS_MIN_SETUP_SCORE) {
        return neutralMixedStat(best.biasLabel, 'Scanner conviction below threshold');
    }
    if (second != null &&
        Number.isFinite(second.setupScore) &&
        best.setupScore - second.setupScore < exports.POSITION_BIAS_RUNNER_UP_GAP) {
        return neutralMixedStat(best.biasLabel, 'Top scanner rows are too close');
    }
    return biasFromMatchedRow(positionSide, best);
}
/**
 * Open leg vs a **specific** scanner row (Trade manage: `selectedSignal`).
 * Returns `null` when there is no row; neutral when the row’s pair base ≠ position instrument.
 * Buffer: minimum setup score before Favorable / Counter.
 */
function positionBiasForSignalRow(positionInstrument, positionSide, signal) {
    if (!signal)
        return null;
    if ((0, tradePairFavorites_1.normalizeTradePairBase)(signal.pair) !== (0, tradePairFavorites_1.normalizeTradePairBase)(positionInstrument)) {
        return {
            variant: 'neutral',
            title: 'N/A',
            subtitle: "Scanner row is ".concat(signal.pair.trim()),
        };
    }
    if (!Number.isFinite(signal.setupScore) || signal.setupScore < exports.POSITION_BIAS_MIN_SETUP_SCORE) {
        return neutralMixedStat(signal.biasLabel, 'Scanner conviction below threshold');
    }
    return biasFromMatchedRow(positionSide, signal);
}
