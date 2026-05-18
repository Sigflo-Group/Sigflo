"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLinearPriceStringForBybit = formatLinearPriceStringForBybit;
exports.linearTpSlStringsForOpen = linearTpSlStringsForOpen;
/** Stable decimal string for Bybit `takeProfit` / `stopLoss` (no scientific notation). */
function formatLinearPriceStringForBybit(price) {
    if (!Number.isFinite(price) || price <= 0)
        return '';
    var s = price.toFixed(12).replace(/\.?0+$/, '');
    return s.length > 0 ? s : String(price);
}
/**
 * Maps UI target/stop to Bybit TP/SL strings only when prices are valid for the side vs entry.
 * Wrong-side levels are omitted (caller may toast).
 */
function linearTpSlStringsForOpen(side, entryPrice, targetParsed, stopParsed) {
    var skippedT = false;
    var skippedS = false;
    var tpSl = {};
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
        return { tpSl: {}, skippedTarget: false, skippedStop: false };
    }
    if (Number.isFinite(targetParsed) && targetParsed > 0) {
        var okLong = side === 'long' && targetParsed > entryPrice;
        var okShort = side === 'short' && targetParsed < entryPrice;
        if (okLong || okShort) {
            tpSl.takeProfit = formatLinearPriceStringForBybit(targetParsed);
        }
        else {
            skippedT = true;
        }
    }
    if (Number.isFinite(stopParsed) && stopParsed > 0) {
        var okLong = side === 'long' && stopParsed < entryPrice;
        var okShort = side === 'short' && stopParsed > entryPrice;
        if (okLong || okShort) {
            tpSl.stopLoss = formatLinearPriceStringForBybit(stopParsed);
        }
        else {
            skippedS = true;
        }
    }
    return { tpSl: tpSl, skippedTarget: skippedT, skippedStop: skippedS };
}
