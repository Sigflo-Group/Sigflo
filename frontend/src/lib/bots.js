"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseBots = exports.BOT_PERSONALITY = exports.BOTS_RECENT_ACTIVITY_MAX = void 0;
exports.botPersonality = botPersonality;
exports.botPersonalityConsensusRows = botPersonalityConsensusRows;
exports.setupTypeFromSignal = setupTypeFromSignal;
exports.statusTone = statusTone;
exports.botCardStatusMeta = botCardStatusMeta;
exports.resolveBotCardStatus = resolveBotCardStatus;
exports.shortActionLabel = shortActionLabel;
exports.formatBotPrice = formatBotPrice;
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var signalState_1 = require("@/lib/signalState");
/** Bots home “Recent Activity” list (pair + status rows). */
exports.BOTS_RECENT_ACTIVITY_MAX = 10;
exports.BOT_PERSONALITY = {
    kai: {
        id: 'kai',
        label: 'Momentum · patient',
        tagline: 'Holds longer through noise, wider stops, lets trends pay.',
        traits: ['Wider stop buffer', 'Adds on clean continuation', 'Defers trims until extension fades'],
        exitAiNote: 'Agent style (Kai): favors holding through chop; widens invalidation before scaling out.',
        comparisonStance: 'Hold',
    },
    nova: {
        id: 'nova',
        label: 'Breakout · balanced',
        tagline: 'Scales out in stages; balances protection with upside.',
        traits: ['Partial trims near targets', 'Balanced risk trims', 'Structure-aware scaling'],
        exitAiNote: 'Agent style (Nova): prefers staged exits and balanced trims as structure evolves.',
        comparisonStance: 'Scale out',
    },
    rio: {
        id: 'rio',
        label: 'Reversal · defensive',
        tagline: 'Tight stops, early invalidation exits, capital first.',
        traits: ['Tighter invalidation', 'Early stand-aside', 'Defensive after rejection'],
        exitAiNote: 'Agent style (Rio): tightens risk quickly when thesis weakens; favors early protection.',
        comparisonStance: 'Exit risk',
    },
};
function botPersonality(id) {
    return exports.BOT_PERSONALITY[id];
}
/** Cross-agent “what each would lean toward” for trust / comparison UI. */
function botPersonalityConsensusRows() {
    return [
        { name: 'Kai', stance: exports.BOT_PERSONALITY.kai.comparisonStance },
        { name: 'Nova', stance: exports.BOT_PERSONALITY.nova.comparisonStance },
        { name: 'Rio', stance: exports.BOT_PERSONALITY.rio.comparisonStance },
    ];
}
exports.baseBots = [
    {
        id: 'bot-kai',
        name: 'Kai',
        strategy: 'Momentum Bot',
        personalityId: 'kai',
        status: 'active',
        watchedPairs: ['BTC', 'ETH', 'SOL'],
        signalId: 'sig-3',
        riskMode: 'balanced',
        intentLine: 'Awaiting confirmation above resistance',
        activityLine: 'Monitoring LINK momentum follow-through',
        stats: { signalsToday: 3, winRatePct: 0, lastResultPct: 2.4 },
        detail: {
            setupStateLabel: 'Momentum continuation',
            bias: 'Long',
            confidencePct: 72,
            setupType: 'Pullback',
            marketContext: { volatility: 'Medium', structure: 'Trending', volume: 'Building' },
            aiNote: 'Momentum can stay constructive while price works below prior swing highs — confirmation only matters once a nearby structural level is clear on your active timeframe.',
            commentaryShort: 'Momentum intact — waiting for structure to tighten (live levels come from the chart).',
        },
    },
    {
        id: 'bot-nova',
        name: 'Nova',
        strategy: 'Breakout Bot',
        personalityId: 'nova',
        status: 'scanning',
        watchedPairs: ['BTC', 'AVAX', 'LINK'],
        signalId: 'sig-1',
        riskMode: 'aggressive',
        expandedSetupPending: true,
        intentLine: 'Scanning for breakout compression',
        activityLine: 'LINK nearing volatility expansion',
        stats: { signalsToday: 2, winRatePct: 0, lastResultPct: 1.3 },
        detail: {
            setupStateLabel: 'Compression watch',
            bias: 'Neutral',
            confidencePct: 58,
            setupType: 'Breakout',
            marketContext: { volatility: 'High', structure: 'Ranging', volume: 'Weak' },
            aiNote: 'Breakout structure is forming, but volume is not yet supportive — waiting for expansion + acceptance.',
            commentaryShort: 'Breakout structure is forming, but volume is not yet supportive.',
            entry: 18.42,
            stop: 17.65,
            target: 20.1,
        },
    },
    {
        id: 'bot-rio',
        name: 'Rio',
        strategy: 'Reversal Bot',
        personalityId: 'rio',
        status: 'active',
        watchedPairs: ['ETH', 'SOL', 'ADA'],
        signalId: 'sig-2',
        riskMode: 'defensive',
        intentLine: 'Waiting for reversal confirmation',
        activityLine: 'SOL rejected from local high, re-evaluating',
        stats: { signalsToday: 1, winRatePct: 0, lastResultPct: -0.8 },
        detail: {
            setupStateLabel: 'Reversal probe',
            bias: 'Short',
            confidencePct: 61,
            setupType: 'Reversal',
            marketContext: { volatility: 'Medium', structure: 'Trending', volume: 'Building' },
            aiNote: 'Rejection at the local high is credible; confirmation needs a lower high fail or breakdown follow-through.',
            commentaryShort: 'Reversal conditions are still weak — waiting for a stronger rejection signal.',
            entry: 142.2,
            stop: 146.8,
            target: 132.5,
        },
    },
];
/** Map engine setup type to card label (overextended → Reversal). */
function setupTypeFromSignal(setupType) {
    if (setupType === 'breakout')
        return 'Breakout';
    if (setupType === 'pullback')
        return 'Pullback';
    return 'Reversal';
}
function statusTone(status) {
    if (status === 'active')
        return { label: 'Active', className: 'text-[#7fffe0]' };
    if (status === 'scanning')
        return { label: 'Scanning', className: 'text-cyan-200' };
    return { label: 'Paused', className: 'text-slate-400' };
}
function botCardStatusMeta(status) {
    switch (status) {
        case 'in_trade':
            return {
                label: 'In trade',
                dotClass: 'bg-[#00ffc8] shadow-[0_0_10px_rgba(0,255,200,0.55)]',
                textClass: 'text-[#7fffe0]',
            };
        case 'setup_forming':
            return {
                label: 'Setup forming',
                dotClass: 'bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.35)]',
                textClass: 'text-amber-200/95',
            };
        case 'scanning':
            return {
                label: 'Scanning',
                dotClass: 'bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.35)]',
                textClass: 'text-cyan-200',
            };
        case 'paused':
            return {
                label: 'Paused',
                dotClass: 'bg-slate-500',
                textClass: 'text-slate-400',
            };
        default:
            return {
                label: 'Active',
                dotClass: 'bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.3)]',
                textClass: 'text-emerald-200/95',
            };
    }
}
/**
 * Live card status: pause wins; then signal “triggered” → in trade; “setup” → setup_forming;
 * else fall back to stored bot mode (active / scanning).
 */
function resolveBotCardStatus(stored, uiState) {
    if (stored === 'paused')
        return 'paused';
    if (uiState === 'triggered')
        return 'in_trade';
    if (uiState === 'setup_forming')
        return 'setup_forming';
    if (stored === 'scanning')
        return 'scanning';
    return 'active';
}
function shortActionLabel(signal) {
    var marketStatus = (0, marketScannerRows_1.deriveMarketStatus)(signal);
    var uiState = (0, signalState_1.uiSignalStateFromMarketStatus)(marketStatus);
    return "".concat(signal.pair, " ").concat((0, signalState_1.uiSignalStateLabel)(uiState).toLowerCase());
}
function formatBotPrice(n) {
    if (n == null || !Number.isFinite(n) || n <= 0)
        return '—';
    if (n >= 1000)
        return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 1)
        return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}
