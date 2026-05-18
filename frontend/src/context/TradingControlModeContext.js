"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingControlModeProvider = TradingControlModeProvider;
exports.useTradingControlMode = useTradingControlMode;
var react_1 = require("react");
var tradingControlMode_1 = require("@/lib/tradingControlMode");
var TradingControlModeContext = (0, react_1.createContext)(null);
function TradingControlModeProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(function () {
        return typeof window !== 'undefined' ? (0, tradingControlMode_1.loadTradingControlMode)() : tradingControlMode_1.DEFAULT_TRADING_CONTROL_MODE;
    }), mode = _b[0], setModeState = _b[1];
    var _c = (0, react_1.useState)(null), feedback = _c[0], setFeedback = _c[1];
    var feedbackTimerRef = (0, react_1.useRef)(undefined);
    var modeRef = (0, react_1.useRef)(mode);
    modeRef.current = mode;
    var setMode = (0, react_1.useCallback)(function (next) {
        if (modeRef.current === next)
            return;
        modeRef.current = next;
        window.localStorage.setItem(tradingControlMode_1.TRADING_CONTROL_MODE_STORAGE_KEY, next);
        setModeState(next);
        window.clearTimeout(feedbackTimerRef.current);
        setFeedback((0, tradingControlMode_1.tradingModeSwitchToast)(next));
        feedbackTimerRef.current = window.setTimeout(function () {
            setFeedback(null);
        }, 3400);
    }, []);
    (0, react_1.useEffect)(function () {
        return function () { return window.clearTimeout(feedbackTimerRef.current); };
    }, []);
    var value = (0, react_1.useMemo)(function () { return ({
        mode: mode,
        setMode: setMode,
        meta: tradingControlMode_1.TRADING_CONTROL_MODE_META[mode],
    }); }, [mode, setMode]);
    return (<TradingControlModeContext.Provider value={value}>
      {children}
      {feedback ? (<div className="pointer-events-none fixed left-1/2 z-[100] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 transition-opacity duration-200" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }} role="status">
          <div className="rounded-xl border border-[#00ffc8]/30 bg-black/92 px-3 py-2.5 text-center text-xs font-semibold leading-snug text-[#b8fff0] shadow-[0_12px_40px_-12px_rgba(0,255,200,0.2)] backdrop-blur-md">
            {feedback}
          </div>
        </div>) : null}
    </TradingControlModeContext.Provider>);
}
function useTradingControlMode() {
    var ctx = (0, react_1.useContext)(TradingControlModeContext);
    if (!ctx)
        throw new Error('useTradingControlMode must be used within TradingControlModeProvider');
    return ctx;
}
