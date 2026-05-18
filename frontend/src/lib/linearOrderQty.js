"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPEN_ORDER_NOTIONAL_BUFFER_FACTOR = void 0;
exports.applyOpenOrderNotionalBuffer = applyOpenOrderNotionalBuffer;
exports.linearQtyFromNotionalUsd = linearQtyFromNotionalUsd;
exports.linearQtyFromBaseAmount = linearQtyFromBaseAmount;
exports.spotQuoteQtyFromUsd = spotQuoteQtyFromUsd;
/**
 * Shrink ordered notional vs UI “position size” so exchange margin checks (IM buffer, fees, rounding)
 * are less likely to reject with errors like “ab not enough for new order”.
 * When the user is at exactly the venue minimum notional, we do not go below that floor.
 */
exports.OPEN_ORDER_NOTIONAL_BUFFER_FACTOR = 0.985;
function applyOpenOrderNotionalBuffer(notionalUsd, opts) {
    if (!(notionalUsd > 0))
        return 0;
    var out = notionalUsd * exports.OPEN_ORDER_NOTIONAL_BUFFER_FACTOR;
    var minN = opts === null || opts === void 0 ? void 0 : opts.minNotionalUsd;
    if (minN != null && minN > 0 && notionalUsd + 1e-9 >= minN && out + 1e-9 < minN) {
        out = minN;
    }
    return out;
}
/** Base-coin qty string for Bybit linear `qty` (no scientific notation). */
function linearQtyFromNotionalUsd(notionalUsd, priceUsd, maxDecimals) {
    if (maxDecimals === void 0) { maxDecimals = 8; }
    if (!(notionalUsd > 0) || !(priceUsd > 0))
        return '0';
    var raw = notionalUsd / priceUsd;
    var s = raw.toFixed(maxDecimals).replace(/\.?0+$/, '');
    return s === '' ? '0' : s;
}
function linearQtyFromBaseAmount(base, maxDecimals) {
    if (maxDecimals === void 0) { maxDecimals = 8; }
    if (!Number.isFinite(base) || base <= 0)
        return '0';
    var s = base.toFixed(maxDecimals).replace(/\.?0+$/, '');
    return s === '' ? '0' : s;
}
/** Quote (e.g. USDT) amount for Bybit spot market `Buy` with `marketUnit: quoteCoin`. */
function spotQuoteQtyFromUsd(usd, maxDecimals) {
    if (maxDecimals === void 0) { maxDecimals = 2; }
    if (!(usd > 0))
        return '0';
    var s = usd.toFixed(maxDecimals).replace(/\.?0+$/, '');
    return s === '' ? '0' : s;
}
