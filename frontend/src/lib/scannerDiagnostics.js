"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordScannerDiagnostic = recordScannerDiagnostic;
var DIAGNOSTIC_LIMIT = 20;
var STORE_KEY = '__SIGFLO_SCANNER_DIAGNOSTICS__';
function recordScannerDiagnostic(entry) {
    var g = globalThis;
    var current = Array.isArray(g[STORE_KEY]) ? g[STORE_KEY] : [];
    var next = __spreadArray(__spreadArray([], current, true), [entry], false).slice(-DIAGNOSTIC_LIMIT);
    g[STORE_KEY] = next;
    if (import.meta.env.DEV) {
        var debugEnabled = Boolean(globalThis.__SIGFLO_SCANNER_DEBUG__);
        if (debugEnabled) {
            console.debug('[Sigflo][ScannerLifecycle]', {
                symbol: entry.symbol,
                setupScore: entry.setupScore,
                timingScore: entry.timingScore,
                entryFreshnessScore: entry.entryFreshnessScore,
                roomToTargetScore: entry.roomToTargetScore,
                actionabilityScore: entry.actionabilityScore,
                state: entry.state,
                triggerType: entry.triggerType,
                idealEntryPrice: entry.idealEntryPrice,
                currentPrice: entry.currentPrice,
                atrExtensionFromIdeal: entry.atrExtensionFromIdeal,
                candlesSinceTrigger: entry.candlesSinceTrigger,
                candlesSincePeakTiming: entry.candlesSincePeakTiming,
                penalties: entry.penalties,
                positiveFactors: entry.positiveFactors,
            });
        }
    }
}
