"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatQuoteNumber = formatQuoteNumber;
exports.formatQuoteUsd = formatQuoteUsd;
exports.formatQuoteGuidance = formatQuoteGuidance;
/**
 * Format a live quote (last / OHLC) without a currency prefix.
 * Sub-dollar assets use enough fraction digits so values like 0.00334 are not rounded to "0".
 */
function formatQuoteNumber(n) {
    if (!Number.isFinite(n))
        return '—';
    if (n >= 10000)
        return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 1000)
        return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (n >= 1)
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 0.01)
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}
function formatQuoteUsd(n) {
    return "$".concat(formatQuoteNumber(n));
}
/**
 * Prices in short prose (exit guidance, automation hints): fewer decimals so values
 * like 144.92 don’t read as false precision vs chart inputs / tick size.
 */
function formatQuoteGuidance(n) {
    if (!Number.isFinite(n))
        return '—';
    var abs = Math.abs(n);
    if (abs >= 10000)
        return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (abs >= 1000)
        return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (abs >= 100)
        return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (abs >= 1)
        return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (abs >= 0.01)
        return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
}
