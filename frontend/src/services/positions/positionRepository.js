"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePositionPairKey = normalizePositionPairKey;
/** Normalize `BTC / USDT`, `BTCUSDT`, `btc-usdt` → `BTCUSDT`. */
function normalizePositionPairKey(pair) {
    return pair
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/\//g, '')
        .replace(/-/g, '');
}
