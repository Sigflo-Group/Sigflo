"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHART_TIMESCALE_MAX_BAR_SPACING_PX = exports.BOT_FOCUS_FULL_CHART_DOCK_GAP_PX = exports.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL = exports.BOT_FOCUS_FULL_CHART_OUTSIDE_PLOT_RESERVE_PX = exports.BOT_FOCUS_FULL_CHART_FLEX_BASIS = exports.BOT_FOCUS_CHART_PLOT_PX = exports.TRADE_CHART_PLOT_MANAGE_MAXIMIZED_PX = exports.TRADE_CHART_PLOT_COLLAPSED_PX = exports.TRADE_CHART_PLOT_EXPANDED_PX = void 0;
/**
 * Trade screen — Lightweight Charts plot height (px).
 *
 * **Single source of truth.** Import these constants from this file only.
 * Do not reintroduce stray literals on `ChartHeader`,
 * `TradeScreen`, or `PriceChartCard` defaults — that caused repeated drift.
 */
/** Expanded / collapsed plot heights (px); keep in sync if layout changes. */
exports.TRADE_CHART_PLOT_EXPANDED_PX = 139;
exports.TRADE_CHART_PLOT_COLLAPSED_PX = 58;
/** Manage position screen — enlarged chart plot height when user taps maximize. */
exports.TRADE_CHART_PLOT_MANAGE_MAXIMIZED_PX = 238;
/** Bot focus cockpit — primary chart plot height (px). */
exports.BOT_FOCUS_CHART_PLOT_PX = 134;
/**
 * Immersive bot full-chart chart-slot `flex-basis`. Use `0%` with `flex-grow: 1` so the slot fills the
 * scroll column reliably; a percentage basis here can leave dead vertical space in nested flex layouts.
 */
exports.BOT_FOCUS_FULL_CHART_FLEX_BASIS = '0%';
/**
 * Full-chart `plotExpandedPx` is only the Lightweight Charts container height. `PriceChartCard` also
 * renders card padding, the exchange hero (price + TF row), and the Vol / overlay / `MarketStatsRow`
 * strip below the plot. Subtract this from the measured slot (after padding) so the full card fits
 * inside the flex slot and volume + TradingView branding are not clipped.
 *
 * When {@link BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL} is true, the plot uses flex-fill instead of this reserve.
 */
exports.BOT_FOCUS_FULL_CHART_OUTSIDE_PLOT_RESERVE_PX = 132;
/** Immersive bot full-chart: grow the plot inside the card so header/toolbar are never clipped. */
exports.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL = true;
/** Visual gap (px) between the chart card and the tools dock — applied as padding on the chart slot. */
exports.BOT_FOCUS_FULL_CHART_DOCK_GAP_PX = 12;
/**
 * Max horizontal pixels per candle after `fitContent()` (trade dock, manage chart, bot focus).
 * Keeps pan/zoom feel consistent and avoids huge candles on wide layouts.
 */
exports.CHART_TIMESCALE_MAX_BAR_SPACING_PX = 9;
