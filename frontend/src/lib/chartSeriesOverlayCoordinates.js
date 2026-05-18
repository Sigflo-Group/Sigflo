"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seriesPriceToOverlayY = seriesPriceToOverlayY;
exports.clientYToSeriesCoordinateY = clientYToSeriesCoordinateY;
function paneTopOffsetInPlot(plotEl, series) {
    try {
        var paneEl = series.getPane().getHTMLElement();
        if (!paneEl || !plotEl.contains(paneEl))
            return 0;
        return paneEl.getBoundingClientRect().top - plotEl.getBoundingClientRect().top;
    }
    catch (_a) {
        return 0;
    }
}
/**
 * Map price → Y in the same coordinate system as `plotEl` (chart container), for HTML stacked on the chart.
 * lightweight-charts v5+ reports `priceToCoordinate` in the series pane; add the pane's offset inside `plotEl`.
 */
function seriesPriceToOverlayY(plotEl, series, price) {
    var coord = series.priceToCoordinate(price);
    if (coord == null)
        return null;
    var yLocal = Number(coord);
    if (!Number.isFinite(yLocal))
        return null;
    return paneTopOffsetInPlot(plotEl, series) + yLocal;
}
/**
 * Vertical coordinate inside the series pane (same space as `priceToCoordinate` / `coordinateToPrice`).
 */
function clientYToSeriesCoordinateY(series, clientY) {
    try {
        var paneEl = series.getPane().getHTMLElement();
        if (!paneEl)
            return null;
        var y = clientY - paneEl.getBoundingClientRect().top;
        return Number.isFinite(y) ? y : null;
    }
    catch (_a) {
        return null;
    }
}
