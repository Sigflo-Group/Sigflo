"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spotBaseAssetFromOrderSymbol = spotBaseAssetFromOrderSymbol;
/** Base asset for a Bybit v5 spot symbol (e.g. `BTCUSDT` → `BTC`). */
function spotBaseAssetFromOrderSymbol(orderSymbol) {
    var u = orderSymbol.trim().toUpperCase();
    if (u.endsWith('USDT'))
        return u.slice(0, -4);
    if (u.endsWith('USDC'))
        return u.slice(0, -4);
    return u;
}
