"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTradingStyleOnboarded = isTradingStyleOnboarded;
exports.readTradingStyleChoice = readTradingStyleChoice;
exports.markTradingStyleOnboarded = markTradingStyleOnboarded;
var KEY_DONE = 'sigflo_trading_style_onboarded';
var KEY_STYLE = 'sigflo_trading_style';
function isTradingStyleOnboarded() {
    try {
        return window.localStorage.getItem(KEY_DONE) === '1';
    }
    catch (_a) {
        return true;
    }
}
function readTradingStyleChoice() {
    try {
        var v = window.localStorage.getItem(KEY_STYLE);
        if (v === 'aggressive' || v === 'balanced' || v === 'defensive')
            return v;
        return null;
    }
    catch (_a) {
        return null;
    }
}
function markTradingStyleOnboarded(choice) {
    try {
        window.localStorage.setItem(KEY_DONE, '1');
        window.localStorage.setItem(KEY_STYLE, choice);
    }
    catch (_a) {
        /* ignore quota / private mode */
    }
}
