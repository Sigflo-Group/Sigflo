"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingViewChartCard = TradingViewChartCard;
var Card_1 = require("@/components/ui/Card");
var react_1 = require("react");
function tvInterval(interval) {
    if (interval === '1')
        return '1';
    if (interval === '5')
        return '5';
    if (interval === '15')
        return '15';
    if (interval === '60')
        return '60';
    if (interval === '240')
        return '240';
    if (interval === 'D')
        return 'D';
    return 'W';
}
function TradingViewChartCard(_a) {
    var symbol = _a.symbol, interval = _a.interval;
    var _b = (0, react_1.useState)(false), loaded = _b[0], setLoaded = _b[1];
    var _c = (0, react_1.useState)(false), timedOut = _c[0], setTimedOut = _c[1];
    var tvSymbol = "BYBIT:".concat(symbol);
    var src = (0, react_1.useMemo)(function () {
        return "https://www.tradingview.com/widgetembed/?" +
            "symbol=".concat(encodeURIComponent(tvSymbol)) +
            "&interval=".concat(encodeURIComponent(tvInterval(interval))) +
            "&theme=dark&style=1&timezone=Etc/UTC" +
            "&withdateranges=1&hide_side_toolbar=1&allow_symbol_change=0&save_image=0&details=0&hotlist=0&calendar=0";
    }, [interval, tvSymbol]);
    (0, react_1.useEffect)(function () {
        setLoaded(false);
        setTimedOut(false);
        var t = window.setTimeout(function () {
            setTimedOut(true);
        }, 7000);
        return function () { return window.clearTimeout(t); };
    }, [src]);
    return (<Card_1.Card panelTexture={false} className="overflow-hidden p-2">
      <div className="mb-2 flex items-center justify-between px-2">
        <h2 className="text-sm font-semibold text-white">TradingView</h2>
        <span className="text-[11px] text-sigflo-muted">{tvSymbol}</span>
      </div>
      <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-white/10 bg-sigflo-bg">
        {!loaded && !timedOut ? (<div className="absolute inset-0 flex items-center justify-center text-xs text-sigflo-muted">
            Loading TradingView...
          </div>) : null}
        {timedOut ? (<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-sigflo-bg/95 px-2.5 text-center">
            <p className="text-xs text-sigflo-muted">
              Embed is blocked in this environment. Open TradingView in a new tab instead.
            </p>
            <a href={"https://www.tradingview.com/chart/?symbol=".concat(encodeURIComponent(tvSymbol))} target="_blank" rel="noreferrer" className="rounded-md border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              Open TradingView
            </a>
          </div>) : null}
        <iframe title="TradingView Chart" src={src} className="h-full w-full bg-sigflo-bg" onLoad={function () { return setLoaded(true); }}/>
      </div>
      <a href={"https://www.tradingview.com/chart/?symbol=".concat(encodeURIComponent(tvSymbol))} target="_blank" rel="noreferrer" className="mt-2 inline-block px-2 text-[11px] text-cyan-300 hover:text-cyan-200">
        Open in TradingView
      </a>
    </Card_1.Card>);
}
