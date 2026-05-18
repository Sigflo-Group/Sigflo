"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTradeQueryString = buildTradeQueryString;
exports.buildBotViewChartTradeQuery = buildBotViewChartTradeQuery;
exports.buildPortfolioPositionTradeQuery = buildPortfolioPositionTradeQuery;
exports.buildManageTradeQueryFromLinearPosition = buildManageTradeQueryFromLinearPosition;
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var watchCue_1 = require("@/lib/watchCue");
/** Query string for `/trade` — matches `buildSignalContextFromQuery` in TradeScreen. */
function buildTradeQueryString(signal, options) {
    var qp = new URLSearchParams({
        signal: signal.id,
        pair: signal.pair,
        setupScore: String(signal.setupScore),
        setupScoreLabel: signal.setupScoreLabel,
        setupType: signal.setupType,
        trend: String(signal.scoreBreakdown.trendAlignment),
        momentum: String(signal.scoreBreakdown.momentumQuality),
        structure: String(signal.scoreBreakdown.structureQuality),
        volume: String(signal.scoreBreakdown.volumeConfirmation),
        risk: String(signal.scoreBreakdown.riskConditions),
        explanation: signal.aiExplanation,
        tags: signal.setupTags.join(','),
        riskTag: signal.riskTag,
        side: signal.side,
        biasLabel: signal.biasLabel,
        watch: (0, watchCue_1.resolveWatchCue)(signal),
    });
    if (options === null || options === void 0 ? void 0 : options.marketStatus)
        qp.set('marketStatus', options.marketStatus);
    qp.set('mode', 'entry');
    return qp.toString();
}
/**
 * Bots screen → full Trade chart: use the bot’s linked signal when present, otherwise first watched pair.
 */
function buildBotViewChartTradeQuery(bot, signal) {
    var _a;
    if (signal) {
        return buildTradeQueryString(signal, { marketStatus: (0, marketScannerRows_1.deriveMarketStatus)(signal) });
    }
    var raw = ((_a = bot.watchedPairs[0]) === null || _a === void 0 ? void 0 : _a.trim()) || 'BTC';
    var linear = raw.toUpperCase().endsWith('USDT') ? raw.toUpperCase() : "".concat(raw.toUpperCase(), "USDT");
    var pair = (0, marketScannerRows_1.symbolToPair)(linear);
    var qp = new URLSearchParams({
        pair: pair,
        side: 'long',
        signal: "bot-chart-".concat(bot.id),
        setupScore: '55',
        trend: '12',
        momentum: '12',
        structure: '12',
        volume: '8',
        risk: '8',
        setupScoreLabel: 'Developing',
        setupType: 'breakout',
        tags: 'Breakout',
        riskTag: 'Medium Risk',
        explanation: 'Chart opened from your bot — watching this market.',
        marketStatus: 'developing',
        biasLabel: 'Bot watch',
        mode: 'entry',
    });
    return qp.toString();
}
/**
 * Minimal `/trade` query from an exchange position (portfolio → chart / ticket shell).
 * Satisfies `buildSignalContextFromQuery` so the Trade screen loads without feed signals.
 */
function buildPortfolioPositionTradeQuery(symbol, side, extras) {
    var pair = (0, marketScannerRows_1.symbolToPair)(symbol);
    var qp = new URLSearchParams({
        pair: pair,
        side: side,
        signal: "pf-".concat(pair),
        setupScore: '58',
        trend: '14',
        momentum: '14',
        structure: '14',
        volume: '10',
        risk: '10',
        setupScoreLabel: 'Developing',
        setupType: 'breakout',
        tags: 'Breakout',
        riskTag: 'Medium Risk',
        explanation: 'Chart context opened from your portfolio position.',
        marketStatus: 'developing',
        biasLabel: side === 'long' ? 'Position long' : 'Position short',
    });
    var hasUsd = (extras === null || extras === void 0 ? void 0 : extras.positionUsd) != null && Number.isFinite(extras.positionUsd) && extras.positionUsd > 0;
    var hasEntry = (extras === null || extras === void 0 ? void 0 : extras.entryPrice) != null && Number.isFinite(extras.entryPrice) && extras.entryPrice > 0;
    if (hasUsd) {
        qp.set('positionUsd', String(Math.round(extras.positionUsd)));
    }
    if (hasEntry) {
        qp.set('portfolioEntry', String(extras.entryPrice));
    }
    if ((extras === null || extras === void 0 ? void 0 : extras.ticketIntent) === 'close' || (extras === null || extras === void 0 ? void 0 : extras.ticketIntent) === 'add') {
        qp.set('ticketIntent', extras.ticketIntent);
    }
    if ((extras === null || extras === void 0 ? void 0 : extras.focusAdjust) === true) {
        qp.set('focusAdjust', '1');
    }
    /** Manage mode only when leg data is complete; otherwise Trade falls back to entry-style shell. */
    if (hasUsd && hasEntry && extras) {
        qp.set('mode', 'manage');
        if (extras.posSize != null && Number.isFinite(extras.posSize)) {
            qp.set('posSize', String(extras.posSize));
        }
        if (extras.markPrice != null && Number.isFinite(extras.markPrice) && extras.markPrice > 0) {
            qp.set('markPrice', String(extras.markPrice));
        }
        if (extras.leverage != null && Number.isFinite(extras.leverage) && extras.leverage > 0) {
            qp.set('leverage', String(Math.round(extras.leverage)));
        }
    }
    return qp.toString();
}
/**
 * `/trade` query for `mode=manage` from a live linear leg (same shape as Portfolio → Trade).
 * Notional uses `|size| × entry` like portfolio cards, not mark × size.
 */
function buildManageTradeQueryFromLinearPosition(pos, options) {
    var _a;
    var notional = Math.abs(pos.size * pos.entryPrice);
    var mark = (_a = options === null || options === void 0 ? void 0 : options.markPrice) !== null && _a !== void 0 ? _a : (pos.markPrice != null && pos.markPrice > 0 ? pos.markPrice : pos.entryPrice);
    var tradeExtras = {
        positionUsd: Math.max(1, Math.round(notional)),
        entryPrice: pos.entryPrice,
        posSize: pos.size,
        markPrice: Number.isFinite(mark) && mark > 0 ? mark : undefined,
        leverage: pos.leverage != null && pos.leverage > 0
            ? pos.leverage
            : (options === null || options === void 0 ? void 0 : options.leverageFallback) != null && options.leverageFallback > 0
                ? Math.round(options.leverageFallback)
                : undefined,
    };
    return buildPortfolioPositionTradeQuery(pos.symbol, pos.side, tradeExtras);
}
