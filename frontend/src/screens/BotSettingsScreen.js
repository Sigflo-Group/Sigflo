"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BotSettingsScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var TradingControlModeContext_1 = require("@/context/TradingControlModeContext");
var useBotUserConfig_1 = require("@/hooks/useBotUserConfig");
var useExitAutomation_1 = require("@/hooks/useExitAutomation");
var botUserConfig_1 = require("@/lib/botUserConfig");
var bots_1 = require("@/lib/bots");
var tradingControlMode_1 = require("@/lib/tradingControlMode");
function SegmentedRow(_a) {
    var value = _a.value, onChange = _a.onChange, options = _a.options;
    return (<div className={"grid gap-1.5 ".concat(options.length === 3 ? 'grid-cols-3' : options.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
      {options.map(function (o) {
            var active = value === o.id;
            var dis = Boolean(o.disabled);
            return (<button key={o.id} type="button" disabled={dis} onClick={function () { return !dis && onChange(o.id); }} className={"rounded-xl border px-2 py-2.5 text-center text-[11px] font-bold transition ".concat(dis
                    ? 'cursor-not-allowed border-white/[0.05] bg-white/[0.02] text-sigflo-muted/50'
                    : active
                        ? 'border-[rgba(0,255,200,0.35)] bg-[rgba(0,255,200,0.1)] text-[#b8fff0]'
                        : 'border-white/[0.08] bg-white/[0.03] text-sigflo-muted hover:border-white/[0.12]')}>
            {o.label}
          </button>);
        })}
    </div>);
}
function FieldLabel(_a) {
    var children = _a.children;
    return <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sigflo-muted">{children}</p>;
}
function SettingsCard(_a) {
    var title = _a.title, children = _a.children;
    return (<section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      {/*
          Match Card.tsx: content must sit above `.sigflo-panel-texture::before` or the grid reads through
          semi-transparent nested fills (bg-black/35) on some engines.
        */}
      <div className="relative z-[1] min-w-0">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-sigflo-muted">{title}</h2>
        <div className="mt-3 space-y-4">{children}</div>
      </div>
    </section>);
}
function BotSettingsScreen() {
    var _a;
    var botId = (0, react_router_dom_1.useParams)().botId;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _b = (0, useBotUserConfig_1.useBotUserConfig)(), configById = _b.configById, updateBotConfig = _b.updateBotConfig;
    var _c = (0, TradingControlModeContext_1.useTradingControlMode)(), tradingMode = _c.mode, setTradingMode = _c.setMode;
    var exitAuto = (0, useExitAutomation_1.useExitAutomation)('bot-settings');
    var bot = (0, react_1.useMemo)(function () { var _a; return (_a = bots_1.baseBots.find(function (b) { return b.id === botId; })) !== null && _a !== void 0 ? _a : null; }, [botId]);
    var defaults = (0, react_1.useMemo)(function () { return (bot ? (0, botUserConfig_1.defaultBotUserConfigFromAgent)(bot) : null); }, [bot]);
    var effective = (0, react_1.useMemo)(function () {
        var _a;
        if (!bot || !defaults)
            return null;
        return (_a = configById[bot.id]) !== null && _a !== void 0 ? _a : defaults;
    }, [bot, configById, defaults]);
    var _d = (0, react_1.useState)(false), advancedOpen = _d[0], setAdvancedOpen = _d[1];
    var _e = (0, react_1.useState)(null), toast = _e[0], setToast = _e[1];
    var toastTimerRef = (0, react_1.useRef)(0);
    var _f = (0, react_1.useState)(''), extraMarkets = _f[0], setExtraMarkets = _f[1];
    (0, react_1.useEffect)(function () {
        if (!effective)
            return;
        var core = new Set(botUserConfig_1.CORE_MARKET_OPTIONS);
        var extras = effective.watchedPairs.filter(function (s) { return !core.has(s); });
        setExtraMarkets(extras.join(', '));
    }, [effective === null || effective === void 0 ? void 0 : effective.watchedPairs.join(','), effective]);
    var queueToast = (0, react_1.useCallback)(function (message) {
        if (message === void 0) { message = 'Preferences saved'; }
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(function () {
            setToast(message);
            window.setTimeout(function () { return setToast(null); }, 2000);
        }, 380);
    }, []);
    (0, react_1.useEffect)(function () {
        return function () { return window.clearTimeout(toastTimerRef.current); };
    }, []);
    var patch = (0, react_1.useCallback)(function (partial, toastMsg) {
        if (!botId)
            return;
        updateBotConfig(botId, partial);
        queueToast(toastMsg);
    }, [botId, updateBotConfig, queueToast]);
    var displayNameForSummary = (effective === null || effective === void 0 ? void 0 : effective.displayName.trim()) || (bot === null || bot === void 0 ? void 0 : bot.name) || 'This agent';
    var previewLine = (0, react_1.useMemo)(function () {
        if (!effective)
            return '';
        return (0, botUserConfig_1.buildBotSettingsSummaryLine)({
            displayName: displayNameForSummary,
            tradeFrequency: effective.tradeFrequency,
            stopBehavior: effective.stopBehavior,
            riskLevel: effective.riskLevel,
        });
    }, [displayNameForSummary, effective]);
    var toggleCoreMarket = function (sym, on) {
        if (!effective)
            return;
        var set = new Set(effective.watchedPairs);
        if (on)
            set.add(sym);
        else
            set.delete(sym);
        var next = (0, botUserConfig_1.normalizeMarketTokens)(__spreadArray([], set, true));
        if (next.length === 0) {
            queueToast('Keep at least one market');
            return;
        }
        patch({ watchedPairs: next });
    };
    var flushExtraMarkets = function () {
        if (!effective)
            return;
        var core = botUserConfig_1.CORE_MARKET_OPTIONS.filter(function (k) { return effective.watchedPairs.includes(k); });
        var extra = (0, botUserConfig_1.normalizeMarketTokens)(extraMarkets
            .split(/[,;\s]+/)
            .map(function (s) { return s.trim(); })
            .filter(Boolean));
        var merged = (0, botUserConfig_1.normalizeMarketTokens)(__spreadArray(__spreadArray([], core, true), extra, true));
        if (merged.length === 0) {
            queueToast('Keep at least one market');
            return;
        }
        patch({ watchedPairs: merged });
    };
    var aggressionToRisk = function (a) {
        return a === 'conservative' ? 'low' : a === 'aggressive' ? 'high' : 'medium';
    };
    var riskToAggression = function (r) {
        return r === 'low' ? 'conservative' : r === 'high' ? 'aggressive' : 'balanced';
    };
    if (!bot || !defaults || !effective) {
        return (<div className="min-h-[100dvh] bg-sigflo-bg px-4 pb-24 pt-4">
        <div className="mx-auto max-w-lg rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-4">
          <div className="relative z-[1]">
            <p className="text-sm text-sigflo-muted">Bot not found.</p>
            <react_router_dom_1.Link to="/bots" className="mt-2 inline-flex text-sm font-semibold text-cyan-200">
              Back to Bots
            </react_router_dom_1.Link>
          </div>
        </div>
      </div>);
    }
    var personality = (0, bots_1.botPersonality)(bot.personalityId);
    var tradingModeOptions = tradingControlMode_1.TRADING_CONTROL_MODE_ORDER.map(function (m) { return ({
        id: m,
        label: m === 'suggestion' ? 'Suggest' : m === 'assisted' ? 'Assisted' : 'Auto',
        disabled: m === 'auto' && !tradingControlMode_1.TRADING_AUTO_EXECUTION_ACTIVE,
    }); });
    var setExitAiEnabled = function (on) {
        var next = on ? 'assisted' : 'manual';
        exitAuto.setMode(next);
        queueToast(on ? 'Exit AI on' : 'Exit AI off');
    };
    var exitAiOn = exitAuto.mode !== 'manual';
    return (<div className="min-h-[100dvh] bg-sigflo-bg pb-28 pt-4">
      <div className="mx-auto w-full max-w-lg space-y-4 px-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <button type="button" onClick={function () { return navigate(-1); }} className="text-[11px] font-semibold text-cyan-200/90 hover:text-cyan-100">
              ← Back
            </button>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-white">Bot settings</h1>
            <p className="mt-1 text-xs text-sigflo-muted">Fine-tune how this agent behaves. Changes apply instantly.</p>
          </div>
          <react_router_dom_1.Link to={"/bots/".concat(bot.id, "/focus")} className="shrink-0 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-cyan-100/90">
            Focus
          </react_router_dom_1.Link>
        </header>

        <div className="rounded-2xl border border-[rgba(0,255,200,0.12)] bg-[rgba(0,255,200,0.04)] px-3 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sigflo-muted">Preview</p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-cyan-100/95">{previewLine}</p>
        </div>

        <SettingsCard title="Bot identity">
          <div>
            <FieldLabel>Display name</FieldLabel>
            <input type="text" value={effective.displayName} onChange={function (e) { return patch({ displayName: e.target.value }, 'Name updated'); }} placeholder={bot.name} className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0c0e12] px-3 py-2.5 text-sm text-white placeholder:text-sigflo-muted/60 focus:border-[rgba(0,255,200,0.35)] focus:outline-none"/>
            <p className="mt-1 text-[10px] text-sigflo-muted">Leave blank to use the default agent name.</p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-[#0c0e12] px-3 py-2.5">
            <FieldLabel>Strategy type</FieldLabel>
            <p className="mt-1 text-sm font-semibold text-white">{bot.strategy}</p>
            <p className="mt-2 text-[10px] text-sigflo-muted">Personality</p>
            <p className="text-xs font-medium text-cyan-100/85">{personality.label}</p>
          </div>
        </SettingsCard>

        <SettingsCard title="Strategy controls">
          <div>
            <FieldLabel>Aggression</FieldLabel>
            <p className="mb-2 mt-1 text-[10px] text-sigflo-muted">Maps to risk temperament for this agent.</p>
            <SegmentedRow value={riskToAggression(effective.riskLevel)} onChange={function (v) { return patch({ riskLevel: aggressionToRisk(v) }); }} options={[
            { id: 'conservative', label: 'Conservative' },
            { id: 'balanced', label: 'Balanced' },
            { id: 'aggressive', label: 'Aggressive' },
        ]}/>
          </div>
          <div>
            <FieldLabel>Markets</FieldLabel>
            <p className="mb-2 mt-1 text-[10px] text-sigflo-muted">Which pairs this agent prioritizes in copy and scans.</p>
            <div className="flex flex-wrap gap-2">
              {botUserConfig_1.CORE_MARKET_OPTIONS.map(function (sym) { return (<button key={sym} type="button" onClick={function () { return toggleCoreMarket(sym, !effective.watchedPairs.includes(sym)); }} className={"rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ".concat(effective.watchedPairs.includes(sym)
                ? 'border-[rgba(0,255,200,0.35)] bg-[rgba(0,255,200,0.1)] text-[#b8fff0]'
                : 'border-white/[0.08] bg-white/[0.03] text-sigflo-muted')}>
                  {sym}
                </button>); })}
            </div>
          </div>
          <div>
            <FieldLabel>Trade frequency</FieldLabel>
            <p className="mb-2 mt-1 text-[10px] text-sigflo-muted">How often the agent looks for new setups (guidance for you, not exchange orders).</p>
            <SegmentedRow value={effective.tradeFrequency} onChange={function (v) { return patch({ tradeFrequency: v }); }} options={[
            { id: 'low', label: 'Low' },
            { id: 'medium', label: 'Medium' },
            { id: 'high', label: 'High' },
        ]}/>
          </div>
        </SettingsCard>

        <button type="button" onClick={function () { return setAdvancedOpen(function (o) { return !o; }); }} className="flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-[#14171d] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-white/[0.12]">
          <span>Advanced</span>
          <span className="text-sigflo-muted">{advancedOpen ? '−' : '+'}</span>
        </button>

        {advancedOpen ? (<>
            <SettingsCard title="Risk management">
              <div>
                <FieldLabel>Risk per trade</FieldLabel>
                <SegmentedRow value={effective.riskUnit} onChange={function (v) { return patch({ riskUnit: v }); }} options={[
                { id: 'percent', label: '% of account' },
                { id: 'dollar', label: 'Fixed $' },
            ]}/>
                {effective.riskUnit === 'percent' ? (<div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-sigflo-muted">
                      <span>Size cap</span>
                      <span className="font-mono font-semibold text-cyan-100/90">{effective.riskPerTradePct.toFixed(2)}%</span>
                    </div>
                    <input type="range" min={0.1} max={5} step={0.05} value={effective.riskPerTradePct} onChange={function (e) { return patch({ riskPerTradePct: Number(e.target.value) }); }} className="mt-2 h-2 w-full cursor-pointer accent-[#00ffc8]"/>
                  </div>) : (<div className="mt-3">
                    <input type="number" min={1} step={1} value={(_a = effective.riskPerTradeUsd) !== null && _a !== void 0 ? _a : 50} onChange={function (e) {
                    return patch({ riskPerTradeUsd: Math.max(1, Number(e.target.value) || 1) });
                }} className="w-full rounded-xl border border-white/[0.08] bg-[#0c0e12] px-3 py-2.5 text-sm text-white focus:border-[rgba(0,255,200,0.35)] focus:outline-none"/>
                  </div>)}
              </div>
              <div>
                <FieldLabel>Max active trades</FieldLabel>
                <div className="flex items-center justify-between text-[11px] text-sigflo-muted">
                  <span>Concurrent ideas</span>
                  <span className="font-mono font-semibold text-cyan-100/90">{effective.maxActiveTrades}</span>
                </div>
                <input type="range" min={1} max={10} step={1} value={effective.maxActiveTrades} onChange={function (e) { return patch({ maxActiveTrades: Number(e.target.value) }); }} className="mt-2 h-2 w-full cursor-pointer accent-[#00ffc8]"/>
              </div>
              <div>
                <FieldLabel>Default position size (USD)</FieldLabel>
                <div className="flex items-center justify-between text-[11px] text-sigflo-muted">
                  <span>Notional hint</span>
                  <span className="font-mono font-semibold text-cyan-100/90">
                    ${effective.defaultPositionSizeUsd.toLocaleString()}
                  </span>
                </div>
                <input type="range" min={25} max={5000} step={25} value={Math.min(5000, effective.defaultPositionSizeUsd)} onChange={function (e) { return patch({ defaultPositionSizeUsd: Number(e.target.value) }); }} className="mt-2 h-2 w-full cursor-pointer accent-[#00ffc8]"/>
                <p className="mt-1 text-[10px] text-sigflo-muted">Used as a starting point in assisted flows; you always confirm on exchange.</p>
              </div>
              <div>
                <FieldLabel>Stop behavior</FieldLabel>
                <SegmentedRow value={effective.stopBehavior} onChange={function (v) { return patch({ stopBehavior: v }); }} options={[
                { id: 'tight', label: 'Tight' },
                { id: 'normal', label: 'Normal' },
                { id: 'wide', label: 'Wide' },
            ]}/>
              </div>
              <div>
                <FieldLabel>Extra tickers</FieldLabel>
                <input type="text" value={extraMarkets} onChange={function (e) { return setExtraMarkets(e.target.value); }} onBlur={flushExtraMarkets} placeholder="e.g. AVAX, LINK" className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0c0e12] px-3 py-2.5 text-sm text-white placeholder:text-sigflo-muted/60 focus:border-[rgba(0,255,200,0.35)] focus:outline-none"/>
                <p className="mt-1 text-[10px] text-sigflo-muted">Add beyond BTC/ETH/SOL. Blur field to save.</p>
              </div>
            </SettingsCard>

            <SettingsCard title="AI behavior">
              <div>
                <FieldLabel>Trading mode</FieldLabel>
                <p className="mb-2 mt-1 text-[10px] text-sigflo-muted">Workspace-wide — how suggestions and tickets behave.</p>
                <SegmentedRow value={tradingMode} onChange={function (m) { return setTradingMode(m); }} options={tradingModeOptions}/>
                {!tradingControlMode_1.TRADING_AUTO_EXECUTION_ACTIVE ? (<p className="mt-2 text-[10px] text-sigflo-muted">Auto execution is off until safeguards ship — preview only.</p>) : null}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0c0e12] px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Exit AI</p>
                  <p className="mt-0.5 text-[10px] text-sigflo-muted">Guided exits on Trade when positions are open.</p>
                </div>
                <button type="button" role="switch" aria-checked={exitAiOn} onClick={function () { return setExitAiEnabled(!exitAiOn); }} className={"relative h-8 w-[52px] shrink-0 rounded-full border transition ".concat(exitAiOn
                ? 'border-[rgba(0,255,200,0.4)] bg-[rgba(0,255,200,0.2)]'
                : 'border-white/[0.1] bg-white/[0.06]')}>
                  <span className={"absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ".concat(exitAiOn ? 'left-7' : 'left-1')}/>
                </button>
              </div>
              <div>
                <FieldLabel>Auto adjustments</FieldLabel>
                <div className="mt-2 space-y-2">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0c0e12] px-3 py-2.5">
                    <span className="text-xs font-medium text-sigflo-text">Move stop with structure</span>
                    <input type="checkbox" checked={effective.autoMoveStop} onChange={function (e) { return patch({ autoMoveStop: e.target.checked }); }} className="h-4 w-4 rounded border-white/20 bg-black/40 accent-[#00ffc8]"/>
                  </label>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0c0e12] px-3 py-2.5">
                    <span className="text-xs font-medium text-sigflo-text">Scale out into strength</span>
                    <input type="checkbox" checked={effective.autoScaleOut} onChange={function (e) { return patch({ autoScaleOut: e.target.checked }); }} className="h-4 w-4 rounded border-white/20 bg-black/40 accent-[#00ffc8]"/>
                  </label>
                </div>
                <p className="mt-2 text-[10px] text-sigflo-muted">
                  Preferences for future automation; live execution still requires your confirmation today.
                </p>
              </div>
            </SettingsCard>
          </>) : null}
      </div>

      {toast ? (<div className="pointer-events-none fixed left-1/2 z-[120] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }} role="status">
          <div className="rounded-xl border border-[#00ffc8]/28 bg-black/92 px-3 py-2.5 text-center text-xs font-semibold text-[#b8fff0] shadow-[0_12px_40px_-12px_rgba(0,255,200,0.2)] backdrop-blur-md">
            {toast}
          </div>
        </div>) : null}
    </div>);
}
