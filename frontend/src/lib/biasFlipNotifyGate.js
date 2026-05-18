"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.biasFlipNotifyTradeFocusLinearSymbolRef = exports.biasFlipNotifyOpenLinearSymbolsRef = void 0;
exports.setBiasFlipNotifyTradeFocusLinearSymbol = setBiasFlipNotifyTradeFocusLinearSymbol;
exports.nextBiasFlipNotifySyncGeneration = nextBiasFlipNotifySyncGeneration;
exports.syncBiasFlipNotifyOpenSymbolsFromSnapshots = syncBiasFlipNotifyOpenSymbolsFromSnapshots;
exports.shouldAnnounceScannerBiasFlip = shouldAnnounceScannerBiasFlip;
/** Ignore dust legs so tiny balances do not subscribe to bias alerts. */
var MIN_BIAS_NOTIFY_POSITION_NOTIONAL_USD = 5;
var BIAS_NOTIFY_FOCUS_STORAGE_KEY = 'sigflo-bias-notify-focus-linear';
/**
 * Scanner bias-flip toasts / OS notifications are limited to symbols where the user
 * has a meaningful open position. {@link syncBiasFlipNotifyOpenSymbolsFromSnapshots}
 * runs whenever a portfolio snapshot refresh finishes (see `AccountSnapshotProvider`).
 *
 * When {@link biasFlipNotifyTradeFocusLinearSymbolRef} is set (last chart symbol from Trade),
 * only that linear symbol may announce — including on Feed/Portfolio — so other open legs
 * do not spam you. If the focused symbol is no longer in the open set, the focus is ignored
 * (stale after closing that leg). Persisted in `sessionStorage` for the tab.
 *
 * Each refresh uses a monotonic {@link nextBiasFlipNotifySyncGeneration} so an older
 * in-flight HTTP response cannot overwrite a newer snapshot (e.g. after closing a leg).
 */
exports.biasFlipNotifyOpenLinearSymbolsRef = {
    current: new Set(),
};
/** Linear symbol for the chart pair to receive bias alerts (e.g. `SOLUSDT`). */
exports.biasFlipNotifyTradeFocusLinearSymbolRef = { current: null };
function persistBiasNotifyFocusToStorage(linearSymbol) {
    try {
        if (linearSymbol)
            sessionStorage.setItem(BIAS_NOTIFY_FOCUS_STORAGE_KEY, linearSymbol);
        else
            sessionStorage.removeItem(BIAS_NOTIFY_FOCUS_STORAGE_KEY);
    }
    catch (_a) {
        /* private mode / SSR */
    }
}
try {
    if (typeof sessionStorage !== 'undefined') {
        var v = (_a = sessionStorage.getItem(BIAS_NOTIFY_FOCUS_STORAGE_KEY)) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase();
        if (v)
            exports.biasFlipNotifyTradeFocusLinearSymbolRef.current = v;
    }
}
catch (_b) {
    /* ignore */
}
function setBiasFlipNotifyTradeFocusLinearSymbol(linearSymbol) {
    var _a;
    var s = (_a = linearSymbol === null || linearSymbol === void 0 ? void 0 : linearSymbol.trim().toUpperCase()) !== null && _a !== void 0 ? _a : '';
    var next = s || null;
    exports.biasFlipNotifyTradeFocusLinearSymbolRef.current = next;
    persistBiasNotifyFocusToStorage(next);
}
function positionCountsForBiasNotify(p) {
    if (!Number.isFinite(p.size) || Math.abs(p.size) === 0)
        return false;
    var entry = p.entryPrice;
    var mark = p.markPrice;
    var px = Number.isFinite(entry) && entry > 0 ? entry : Number.isFinite(mark) && (mark !== null && mark !== void 0 ? mark : 0) > 0 ? mark : 0;
    if (!(px > 0))
        return false;
    var usd = Math.abs(p.size * px);
    return usd >= MIN_BIAS_NOTIFY_POSITION_NOTIONAL_USD;
}
var biasFlipNotifySyncGen = 0;
var biasFlipNotifyLastAppliedGen = 0;
function nextBiasFlipNotifySyncGeneration() {
    biasFlipNotifySyncGen += 1;
    return biasFlipNotifySyncGen;
}
function syncBiasFlipNotifyOpenSymbolsFromSnapshots(items, generation) {
    if (generation < biasFlipNotifyLastAppliedGen)
        return;
    biasFlipNotifyLastAppliedGen = generation;
    var s = new Set();
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var snap = items_1[_i];
        if (snap.status !== 'connected')
            continue;
        for (var _a = 0, _b = snap.positions; _a < _b.length; _a++) {
            var p = _b[_a];
            if (!positionCountsForBiasNotify(p))
                continue;
            var sym = p.symbol.trim().toUpperCase();
            if (sym)
                s.add(sym);
        }
    }
    exports.biasFlipNotifyOpenLinearSymbolsRef.current = s;
}
function shouldAnnounceScannerBiasFlip(linearSymbol) {
    var sym = linearSymbol.trim().toUpperCase();
    var open = exports.biasFlipNotifyOpenLinearSymbolsRef.current;
    if (!sym || !open.has(sym))
        return false;
    var focus = exports.biasFlipNotifyTradeFocusLinearSymbolRef.current;
    if (focus != null && focus !== sym) {
        if (!open.has(focus))
            return true;
        return false;
    }
    return true;
}
