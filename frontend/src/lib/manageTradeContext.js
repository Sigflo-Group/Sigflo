"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseManageTradeContext = parseManageTradeContext;
exports.managePnlFromPrices = managePnlFromPrices;
function parseManageTradeContext(params) {
    var _a, _b, _c;
    if (params.get('mode') !== 'manage')
        return null;
    var pair = (_a = params.get('pair')) === null || _a === void 0 ? void 0 : _a.trim();
    var sideRaw = params.get('side');
    if (!pair || (sideRaw !== 'long' && sideRaw !== 'short'))
        return null;
    var entryRaw = (_b = params.get('portfolioEntry')) !== null && _b !== void 0 ? _b : params.get('entryPrice');
    var entryPrice = entryRaw ? Number(entryRaw) : NaN;
    var posUsdRaw = params.get('positionUsd');
    var positionUsd = posUsdRaw ? Number(posUsdRaw) : NaN;
    if (!Number.isFinite(entryPrice) || entryPrice <= 0)
        return null;
    if (!Number.isFinite(positionUsd) || positionUsd <= 0)
        return null;
    var markRaw = (_c = params.get('markPrice')) !== null && _c !== void 0 ? _c : params.get('currentPrice');
    var markParsed = markRaw ? Number(markRaw) : NaN;
    var markPrice = Number.isFinite(markParsed) && markParsed > 0 ? markParsed : undefined;
    var ps = params.get('posSize');
    var posSize = ps != null && ps !== '' ? Number(ps) : NaN;
    var posSizeOut = Number.isFinite(posSize) ? posSize : undefined;
    var levRaw = params.get('leverage');
    var levParsed = levRaw != null && levRaw !== '' ? Number(levRaw) : NaN;
    var leverage = Number.isFinite(levParsed) && levParsed > 0 ? Math.min(200, Math.round(levParsed)) : undefined;
    return {
        pair: pair,
        side: sideRaw,
        positionUsd: positionUsd,
        entryPrice: entryPrice,
        markPrice: markPrice,
        posSize: posSizeOut,
        leverage: leverage,
    };
}
function managePnlFromPrices(side, entryPrice, currentPrice, positionUsd) {
    if (!(entryPrice > 0) || !(currentPrice > 0)) {
        return { pnlUsd: 0, pnlPct: 0 };
    }
    var pnlPct = ((side === 'long' ? currentPrice - entryPrice : entryPrice - currentPrice) / entryPrice) * 100;
    var pnlUsd = positionUsd * (pnlPct / 100);
    return { pnlUsd: pnlUsd, pnlPct: pnlPct };
}
