"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketStatsRow = MarketStatsRow;
var formatQuote_1 = require("@/lib/formatQuote");
var scrollHide = '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
function MarketStatsRow(_a) {
    var model = _a.model, _b = _a.variant, variant = _b === void 0 ? 'default' : _b;
    var pos = model.change24hPct >= 0;
    var wrap = variant === 'compact'
        ? "flex min-w-0 max-w-full items-center justify-end gap-x-2 overflow-x-auto whitespace-nowrap text-[7px] font-medium leading-tight text-sigflo-muted md:gap-x-2.5 md:text-[8px] ".concat(scrollHide)
        : "flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-sigflo-muted ".concat(scrollHide);
    return (<div className={wrap} aria-label="24 hour market stats">
      <span className="shrink-0">
        H/L: <span className="text-white">${(0, formatQuote_1.formatQuoteNumber)(model.high24h)} / ${(0, formatQuote_1.formatQuoteNumber)(model.low24h)}</span>
      </span>
      <span className="shrink-0">
        Vol: <span className="text-white">{model.volume24h}</span>
      </span>
      <span className="shrink-0">
        24h:{' '}
        <span className={pos ? 'text-emerald-400' : 'text-rose-400'}>
          {pos ? '+' : ''}
          {model.change24hPct.toFixed(2)}%
        </span>
      </span>
    </div>);
}
