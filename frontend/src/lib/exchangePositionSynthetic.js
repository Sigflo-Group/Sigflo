"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syntheticFromExchangePosition = syntheticFromExchangePosition;
exports.syntheticFromSpotHolding = syntheticFromSpotHolding;
/**
 * Maps a live Bybit linear position into the trade UI shape used by exit guidance and chart overlays.
 */
function syntheticFromExchangePosition(p, displayPair, market, fallbackLeverage) {
    var _a, _b, _c, _d;
    var mark = p.markPrice != null && p.markPrice > 0 ? p.markPrice : p.entryPrice;
    var notional = Math.abs(p.size) * mark;
    var lev = p.leverage != null && p.leverage > 0 ? p.leverage : fallbackLeverage;
    var margin = p.positionIM != null && p.positionIM > 0 ? p.positionIM : notional / Math.max(1, lev);
    return {
        id: "bybit:".concat(p.symbol, ":").concat(p.side),
        symbol: displayPair,
        side: p.side,
        market: market,
        leverage: lev,
        entryPrice: p.entryPrice,
        positionNotionalUsd: notional,
        marginUsd: Math.max(1e-9, margin),
        liquidationPrice: (_a = p.liqPrice) !== null && _a !== void 0 ? _a : null,
        takeProfitPrice: (_b = p.takeProfitPrice) !== null && _b !== void 0 ? _b : null,
        stopLossPrice: (_c = p.stopLossPrice) !== null && _c !== void 0 ? _c : null,
        openedAtMs: (_d = p.openedAtMs) !== null && _d !== void 0 ? _d : Date.now(),
    };
}
/**
 * Spot "position" for the trade UI: derived from wallet free balance of the pair base asset.
 */
function syntheticFromSpotHolding(freeBaseQty, orderSymbol, displayPair, markUsd) {
    var notional = freeBaseQty * markUsd;
    return {
        id: "bybit-spot:".concat(orderSymbol),
        symbol: displayPair,
        side: 'long',
        market: 'spot',
        leverage: 1,
        entryPrice: markUsd,
        positionNotionalUsd: notional,
        marginUsd: Math.max(1e-9, notional),
        liquidationPrice: null,
        takeProfitPrice: null,
        stopLossPrice: null,
        openedAtMs: Date.now(),
    };
}
