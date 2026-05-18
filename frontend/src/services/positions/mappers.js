"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sigfloActiveToStripPosition = sigfloActiveToStripPosition;
exports.sigfloActivePositionFromExchange = sigfloActivePositionFromExchange;
exports.simulatedFromSigfloActive = simulatedFromSigfloActive;
var positionRepository_1 = require("@/services/positions/positionRepository");
function formatStripPairLabel(pair) {
    var t = pair.trim();
    if (t.includes('/'))
        return t.replace(/\s*\/\s*/g, ' / ');
    var u = t.toUpperCase();
    var base = u.replace(/USDT$/i, '').replace(/USDC$/i, '').replace(/[^A-Z0-9]/g, '');
    if (base && u.endsWith('USDT'))
        return "".concat(base, " / USDT");
    if (base && u.endsWith('USDC'))
        return "".concat(base, " / USDC");
    return t || '—';
}
function sigfloActiveToStripPosition(p) {
    var isPaper = p.source === 'bots-paper' || p.source === 'demo';
    return {
        pairKey: (0, positionRepository_1.normalizePositionPairKey)(p.pair),
        pairLabel: formatStripPairLabel(p.pair),
        direction: p.direction,
        unrealizedPnl: p.unrealizedPnl,
        unrealizedPnlPct: p.unrealizedPnlPct,
        isPaper: isPaper,
        sourceLabel: isPaper ? 'PAPER' : 'LIVE',
    };
}
function sigfloActivePositionFromExchange(p, displayPair, liveMark) {
    var _a, _b, _c;
    var mark = p.markPrice != null && Number.isFinite(p.markPrice) && p.markPrice > 0 ? p.markPrice : liveMark;
    var lev = p.leverage != null && p.leverage > 0 ? p.leverage : 1;
    var notional = Math.abs(p.size) * (mark > 0 ? mark : p.entryPrice);
    var margin = p.positionIM != null && p.positionIM > 0 ? p.positionIM : notional / Math.max(1, lev);
    var pnlUsd = p.unrealizedPnl != null && Number.isFinite(p.unrealizedPnl) ? p.unrealizedPnl : 0;
    var pnlPct = margin > 0 ? (pnlUsd / margin) * 100 : 0;
    var targets = [];
    if (p.takeProfitPrice != null && Number.isFinite(p.takeProfitPrice) && p.takeProfitPrice > 0) {
        targets.push(p.takeProfitPrice);
    }
    return {
        id: "bybit:".concat(p.symbol, ":").concat(p.side),
        pair: displayPair,
        direction: p.side,
        entryPrice: p.entryPrice,
        markPrice: mark > 0 ? mark : p.entryPrice,
        size: p.size,
        leverage: lev,
        marginMode: 'cross',
        unrealizedPnl: pnlUsd,
        unrealizedPnlPct: pnlPct,
        stopPrice: (_a = p.stopLossPrice) !== null && _a !== void 0 ? _a : null,
        liquidationPrice: (_b = p.liqPrice) !== null && _b !== void 0 ? _b : null,
        targets: targets,
        openedAt: (_c = p.openedAtMs) !== null && _c !== void 0 ? _c : Date.now(),
        source: 'bybit',
    };
}
function simulatedFromSigfloActive(p, market) {
    var _a;
    var m = Number.isFinite(p.markPrice) && p.markPrice > 0 ? p.markPrice : p.entryPrice;
    var notional = Math.abs(p.size) * m;
    var margin = notional / Math.max(1, p.leverage);
    return {
        id: p.id,
        symbol: p.pair,
        side: p.direction,
        market: market,
        leverage: p.leverage,
        entryPrice: p.entryPrice,
        positionNotionalUsd: notional,
        marginUsd: Math.max(1e-9, margin),
        liquidationPrice: p.liquidationPrice,
        takeProfitPrice: (_a = p.targets[0]) !== null && _a !== void 0 ? _a : null,
        stopLossPrice: p.stopPrice,
        openedAtMs: p.openedAt,
    };
}
