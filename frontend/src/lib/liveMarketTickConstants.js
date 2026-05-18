"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIVE_MARKET_CHART_THROTTLE_MS = exports.LIVE_MARKET_UI_THROTTLE_MS = void 0;
/** Min interval between React commits for quote fields (price, 24h, uPnL drivers). */
exports.LIVE_MARKET_UI_THROTTLE_MS = 100;
/** Min interval between chart series commits (OHLC in state); bypassed on closed candle. */
exports.LIVE_MARKET_CHART_THROTTLE_MS = 200;
