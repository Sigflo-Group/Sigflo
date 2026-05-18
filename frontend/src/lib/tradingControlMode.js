"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRADING_CONTROL_MODE_ORDER = exports.TRADING_CONTROL_MODE_META = exports.TRADING_AUTO_EXECUTION_ACTIVE = exports.DEFAULT_TRADING_CONTROL_MODE = exports.TRADING_CONTROL_MODE_STORAGE_KEY = void 0;
exports.parseTradingControlMode = parseTradingControlMode;
exports.loadTradingControlMode = loadTradingControlMode;
exports.tradingControlModeAllowsPreparedPlans = tradingControlModeAllowsPreparedPlans;
exports.tradingControlModeAllowsAutomatedExecution = tradingControlModeAllowsAutomatedExecution;
exports.tradingModeSwitchToast = tradingModeSwitchToast;
exports.TRADING_CONTROL_MODE_STORAGE_KEY = 'sigflo.tradingControlMode';
exports.DEFAULT_TRADING_CONTROL_MODE = 'suggestion';
/** When true, exchange orders still require explicit user confirmation (future automation). */
exports.TRADING_AUTO_EXECUTION_ACTIVE = false;
function parseTradingControlMode(raw) {
    if (raw === 'suggestion' || raw === 'assisted' || raw === 'auto')
        return raw;
    return exports.DEFAULT_TRADING_CONTROL_MODE;
}
function loadTradingControlMode() {
    if (typeof window === 'undefined')
        return exports.DEFAULT_TRADING_CONTROL_MODE;
    return parseTradingControlMode(window.localStorage.getItem(exports.TRADING_CONTROL_MODE_STORAGE_KEY));
}
exports.TRADING_CONTROL_MODE_META = {
    suggestion: {
        label: 'Suggestion',
        shortLabel: 'Suggestion',
        sheetDescription: 'AI analyzes. You execute.',
        sheetSubtext: 'No trades happen without your action.',
        botsSummary: 'AI analyzes markets and suggests setups — you execute every trade yourself.',
        botsDetail: 'Nothing is sent to the exchange without your explicit confirmation.',
        tradeHint: 'Suggestion — AI advises; you execute all orders manually.',
        focusHint: 'Suggestion — AI advises; you confirm every execution from this workspace.',
        allowsPreparedExecution: false,
        allowsAutomatedExecution: false,
    },
    assisted: {
        label: 'Assisted',
        shortLabel: 'Assisted',
        sheetDescription: 'AI prepares. You approve.',
        sheetSubtext: 'Faster execution with guided inputs.',
        botsSummary: 'AI prepares size, stops, and tickets — you approve before anything is sent.',
        botsDetail: 'Review prefilled risk and slide to confirm. Exit automation on Trade is separate when you enable it.',
        tradeHint: 'Assisted — review prepared trades and confirm execution.',
        focusHint: 'Assisted — tickets and risk are prepared for your approval before send.',
        allowsPreparedExecution: true,
        allowsAutomatedExecution: false,
    },
    auto: {
        label: 'Auto',
        shortLabel: 'Auto',
        sheetDescription: 'AI executes within your rules.',
        sheetSubtext: 'Requires defined risk limits.',
        botsSummary: 'Future: hands-off execution within your limits — not active yet.',
        botsDetail: 'Automated orders need clear safeguards. Until then, Sigflo still requires your confirmation on every execution.',
        tradeHint: 'Auto (preview) — unattended trading is off; confirm orders as usual.',
        focusHint: 'Auto (preview) — no unattended orders yet; safeguards and limits will ship before live automation.',
        allowsPreparedExecution: true,
        allowsAutomatedExecution: exports.TRADING_AUTO_EXECUTION_ACTIVE,
    },
};
exports.TRADING_CONTROL_MODE_ORDER = ['suggestion', 'assisted', 'auto'];
/** Use when gating “prepared ticket” UX (e.g. assisted execution flows). */
function tradingControlModeAllowsPreparedPlans(mode) {
    return exports.TRADING_CONTROL_MODE_META[mode].allowsPreparedExecution;
}
/** True only when unattended exchange execution is implemented and enabled. */
function tradingControlModeAllowsAutomatedExecution(mode) {
    return exports.TRADING_AUTO_EXECUTION_ACTIVE && exports.TRADING_CONTROL_MODE_META[mode].allowsAutomatedExecution;
}
function tradingModeSwitchToast(mode) {
    return "Switched to ".concat(exports.TRADING_CONTROL_MODE_META[mode].label, " Mode");
}
