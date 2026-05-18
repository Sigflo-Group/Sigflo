"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLiveBotSetupCopy = buildLiveBotSetupCopy;
var bots_1 = require("@/lib/bots");
var resistanceDetection_1 = require("@/lib/resistanceDetection");
function biasNorm(bias) {
    var b = bias.trim().toLowerCase();
    if (b === 'short')
        return 'short';
    if (b === 'long')
        return 'long';
    return 'neutral';
}
/**
 * Production-safe copy for bot / setup UI: only injects a numeric level when swing logic + distance
 * + final % guard all pass. Otherwise uses non-numeric fallback so we never imply a fake trigger.
 */
function buildLiveBotSetupCopy(args) {
    var _a;
    var candles = args.candles, currentPrice = args.currentPrice;
    if (!(currentPrice > 0) || !(candles === null || candles === void 0 ? void 0 : candles.length) || candles.length < 5) {
        return null;
    }
    var interval = (_a = args.intervalLabel) === null || _a === void 0 ? void 0 : _a.trim();
    var structureFootnote = interval ? "Structure from recent ".concat(interval, " candles (swing highs/lows).") : null;
    var side = biasNorm(args.bias);
    if (side === 'neutral') {
        return {
            level: null,
            structureKind: null,
            intentLine: 'Awaiting clearer structure',
            commentaryShort: 'Momentum context is mixed — waiting for the tape to tighten before flagging a level.',
            structureFootnote: structureFootnote,
        };
    }
    if (side === 'long') {
        var level_1 = (0, resistanceDetection_1.detectNearestResistanceFromChartCandles)(candles, currentPrice);
        return {
            level: level_1,
            structureKind: level_1 != null ? 'resistance' : null,
            intentLine: 'Awaiting confirmation above resistance',
            commentaryShort: level_1 != null
                ? "Momentum intact \u2014 needs acceptance above ".concat((0, bots_1.formatBotPrice)(level_1), ".")
                : 'Momentum intact — waiting for structure to tighten.',
            structureFootnote: structureFootnote,
        };
    }
    var level = (0, resistanceDetection_1.detectNearestSupportFromChartCandles)(candles, currentPrice);
    return {
        level: level,
        structureKind: level != null ? 'support' : null,
        intentLine: 'Awaiting confirmation below support',
        commentaryShort: level != null
            ? "Bearish thesis needs acceptance below ".concat((0, bots_1.formatBotPrice)(level), ".")
            : 'Bearish thesis — waiting for structure to tighten before flagging a level.',
        structureFootnote: structureFootnote,
    };
}
