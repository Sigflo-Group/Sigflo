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
exports.TRADE_FAVORITES_CHANGED_EVENT = exports.TRADE_PAIR_FAVORITES_STORAGE_KEY = void 0;
exports.normalizeTradePairBase = normalizeTradePairBase;
exports.readTradePairFavorites = readTradePairFavorites;
exports.isTradePairFavorite = isTradePairFavorite;
exports.toggleTradePairFavorite = toggleTradePairFavorite;
exports.TRADE_PAIR_FAVORITES_STORAGE_KEY = 'sigflo.tradePairFavorites.v1';
exports.TRADE_FAVORITES_CHANGED_EVENT = 'sigflo-trade-favorites-changed';
var MAX_FAVORITES = 48;
/** Normalize signal / trade `pair` to a bare base symbol (e.g. BTC). */
function normalizeTradePairBase(pair) {
    var raw = pair.trim().toUpperCase();
    var base = raw.includes('/') ? raw.split('/')[0].trim() : raw.replace(/USDT$/i, '').trim();
    var clean = base.replace(/[^A-Z0-9]/g, '');
    return clean || 'BTC';
}
function parseList(raw) {
    if (!raw)
        return [];
    try {
        var p = JSON.parse(raw);
        if (!Array.isArray(p))
            return [];
        return p.filter(function (x) { return typeof x === 'string'; });
    }
    catch (_a) {
        return [];
    }
}
function readTradePairFavorites() {
    if (typeof window === 'undefined')
        return [];
    var seen = new Set();
    var out = [];
    for (var _i = 0, _a = parseList(window.localStorage.getItem(exports.TRADE_PAIR_FAVORITES_STORAGE_KEY)); _i < _a.length; _i++) {
        var s = _a[_i];
        var b = normalizeTradePairBase(s);
        if (seen.has(b))
            continue;
        seen.add(b);
        out.push(b);
        if (out.length >= MAX_FAVORITES)
            break;
    }
    return out;
}
function isTradePairFavorite(pair) {
    var b = normalizeTradePairBase(pair);
    return readTradePairFavorites().includes(b);
}
/** Persists toggle; returns true if the pair is now favorited. */
function toggleTradePairFavorite(pair) {
    var b = normalizeTradePairBase(pair);
    var list = readTradePairFavorites();
    var i = list.indexOf(b);
    var next;
    var nowFavorited;
    if (i >= 0) {
        next = list.filter(function (_, j) { return j !== i; });
        nowFavorited = false;
    }
    else {
        next = __spreadArray(__spreadArray([], list, true), [b], false).slice(0, MAX_FAVORITES);
        nowFavorited = true;
    }
    window.localStorage.setItem(exports.TRADE_PAIR_FAVORITES_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(exports.TRADE_FAVORITES_CHANGED_EVENT));
    }
    return nowFavorited;
}
