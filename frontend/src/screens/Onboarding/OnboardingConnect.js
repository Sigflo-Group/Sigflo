"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OnboardingConnect;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var react_router_dom_1 = require("react-router-dom");
var ExchangeConnectButton_1 = require("@/components/onboarding/ExchangeConnectButton");
var appRoutes_1 = require("@/config/appRoutes");
var AuthContext_1 = require("@/context/AuthContext");
var exchangeConnectOnboarding_1 = require("@/lib/exchangeConnectOnboarding");
var tradingStyleOnboarding_1 = require("@/lib/tradingStyleOnboarding");
var providers = [
    { id: 'bybit', label: 'Bybit', badge: 'B' },
    { id: 'mexc', label: 'MEXC', badge: 'M' },
];
function ConnectionGlyphIcon(_a) {
    var className = _a.className;
    return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.652l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
    </svg>);
}
function OnboardingConnect() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, AuthContext_1.useAuth)(), user = _a.user, authMode = _a.authMode;
    var _b = (0, react_1.useState)(false), manualMode = _b[0], setManualMode = _b[1];
    var _c = (0, react_1.useState)(null), selectedProvider = _c[0], setSelectedProvider = _c[1];
    var _d = (0, react_1.useState)(false), isConnecting = _d[0], setIsConnecting = _d[1];
    var _e = (0, react_1.useState)(null), statusMessage = _e[0], setStatusMessage = _e[1];
    var _f = (0, react_1.useState)(false), manualAwaitContinue = _f[0], setManualAwaitContinue = _f[1];
    var _g = (0, react_1.useState)(''), apiKey = _g[0], setApiKey = _g[1];
    var _h = (0, react_1.useState)(''), secretKey = _h[0], setSecretKey = _h[1];
    var goFeed = (0, react_1.useCallback)(function () {
        (0, exchangeConnectOnboarding_1.markExchangeConnectOnboardingSeen)();
        navigate((0, appRoutes_1.getFeedRoute)(), { replace: true });
    }, [navigate]);
    (0, react_1.useEffect)(function () {
        if (!isConnecting)
            return;
        var t = window.setTimeout(function () { return setIsConnecting(false); }, 900);
        return function () { return window.clearTimeout(t); };
    }, [isConnecting]);
    var onProviderPress = (0, react_1.useCallback)(function (id) {
        setSelectedProvider(id);
        setIsConnecting(true);
        setStatusMessage('Connection flow coming soon.');
    }, []);
    var onManualSubmit = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        setApiKey('');
        setSecretKey('');
        setStatusMessage('Nothing was sent or saved. This is a preview only.');
        setManualAwaitContinue(true);
    }, []);
    if (authMode !== 'supabase' || !user) {
        return <react_router_dom_1.Navigate to={(0, appRoutes_1.getFeedRoute)()} replace/>;
    }
    if (!(0, tradingStyleOnboarding_1.isTradingStyleOnboarded)()) {
        return <react_router_dom_1.Navigate to="/onboarding" replace/>;
    }
    if ((0, exchangeConnectOnboarding_1.isExchangeConnectOnboardingSeen)()) {
        return <react_router_dom_1.Navigate to={(0, appRoutes_1.getFeedRoute)()} replace/>;
    }
    return (<div className="min-h-[100dvh] bg-[#050505] px-5 pb-10 pt-20">
      <framer_motion_1.motion.div className="mx-auto flex max-w-[380px] flex-col items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]" aria-hidden>
          <ConnectionGlyphIcon className="text-white/45"/>
        </div>

        <framer_motion_1.AnimatePresence mode="wait">
          {manualMode ? (<framer_motion_1.motion.div key="manual" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="mt-8 w-full">
              <h1 className="text-center text-2xl font-medium tracking-tight text-zinc-100">Connect manually with API</h1>
              <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-6 text-zinc-400">
                Create a key in your exchange account and paste it here.
              </p>

              <form onSubmit={onManualSubmit} className="mt-8 w-full space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-500">API Key</span>
                  <input type="password" name="apiKey" autoComplete="off" value={apiKey} onChange={function (e) { return setApiKey(e.target.value); }} placeholder="Paste key" className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#00ffc8]/40 focus:bg-white/[0.05] focus:outline-none"/>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-500">Secret Key</span>
                  <input type="password" name="secretKey" autoComplete="off" value={secretKey} onChange={function (e) { return setSecretKey(e.target.value); }} placeholder="Paste secret" className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#00ffc8]/40 focus:bg-white/[0.05] focus:outline-none"/>
                </label>

                <button type="submit" disabled={manualAwaitContinue} className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#00ffc8] text-sm font-medium text-black transition-all hover:brightness-110 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50">
                  Connect account
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
                Make sure withdrawals are disabled when creating your key.
              </p>

              {manualAwaitContinue ? (<div className="mt-4 w-full space-y-3" aria-live="polite" role="status">
                  <p className="text-center text-xs leading-5 text-zinc-500">{statusMessage}</p>
                  <button type="button" onClick={goFeed} className="flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-sm font-medium text-zinc-100 transition-all hover:bg-white/[0.07] active:scale-[0.985]">
                    Continue to Sigflo
                  </button>
                </div>) : null}

              <button type="button" onClick={function () {
                setManualMode(false);
                setStatusMessage(null);
                setManualAwaitContinue(false);
            }} className="mt-6 w-full text-center text-sm text-zinc-400 transition-colors hover:text-zinc-200">
                Back to quick connect
              </button>
            </framer_motion_1.motion.div>) : (<framer_motion_1.motion.div key="quick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="mt-8 w-full">
              <h1 className="text-center text-2xl font-medium tracking-tight text-zinc-100">Connect your exchange</h1>
              <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-6 text-zinc-400">
                Securely link your account to use Sigflo with real trades
              </p>

              <div className="mt-10 flex w-full flex-col gap-3">
                {providers.map(function (p, i) { return (<ExchangeConnectButton_1.ExchangeConnectButton key={p.id} provider={p.id} badge={p.badge} label={"Connect ".concat(p.label)} onPress={function () { return onProviderPress(p.id); }} disabled={isConnecting} motionIndex={i}/>); })}
              </div>

              <button type="button" onClick={function () {
                setStatusMessage(null);
                setManualAwaitContinue(false);
                setManualMode(true);
            }} className="mt-5 w-full text-center text-sm text-zinc-400 transition-colors hover:text-zinc-200">
                Connect manually with API
              </button>

              <ul className="mt-8 w-full space-y-2 text-xs text-zinc-500">
                {['Withdrawals are never enabled', 'You stay in control', 'You can disconnect anytime'].map(function (line) { return (<li key={line} className="flex items-center justify-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-white/25" aria-hidden/>
                    <span>{line}</span>
                  </li>); })}
              </ul>

              <button type="button" onClick={goFeed} className="mt-10 w-full text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300">
                Continue without linking
              </button>
            </framer_motion_1.motion.div>)}
        </framer_motion_1.AnimatePresence>

        {statusMessage && !manualMode ? (<div className="mt-4 w-full text-center" aria-live="polite" role="status">
            <p className="text-xs leading-5 text-zinc-500">{statusMessage}</p>
            {selectedProvider ? (<p className="mt-1 text-[11px] text-zinc-600">
                {selectedProvider === 'bybit' ? 'Bybit' : 'MEXC'} · preview only
              </p>) : null}
          </div>) : null}
      </framer_motion_1.motion.div>
    </div>);
}
