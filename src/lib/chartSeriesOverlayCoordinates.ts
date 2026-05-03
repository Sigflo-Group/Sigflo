import type { ISeriesApi } from 'lightweight-charts';

export type ChartSeriesHost = ISeriesApi<'Candlestick'> | ISeriesApi<'Line'>;

function paneTopOffsetInPlot(plotEl: HTMLElement, series: ChartSeriesHost): number {
  try {
    const paneEl = series.getPane().getHTMLElement();
    if (!paneEl || !plotEl.contains(paneEl)) return 0;
    return paneEl.getBoundingClientRect().top - plotEl.getBoundingClientRect().top;
  } catch {
    return 0;
  }
}

/**
 * Map a series price to Y (px) in `plotEl`'s local coordinate system (top of `plotEl` = 0).
 * In lightweight-charts v5+, `priceToCoordinate` is in the series pane's space; HTML overlays
 * sit on the outer chart container, so we add the pane's vertical offset inside that container.
 */
export function seriesPriceToOverlayY(
  plotEl: HTMLElement,
  series: ChartSeriesHost,
  price: number,
): number | null {
  const coord = series.priceToCoordinate(price);
  if (coord == null) return null;
  const yLocal = Number(coord);
  if (!Number.isFinite(yLocal)) return null;
  return paneTopOffsetInPlot(plotEl, series) + yLocal;
}

/**
 * Vertical coordinate inside the series pane (same space as `priceToCoordinate` / `coordinateToPrice`).
 */
export function clientYToSeriesCoordinateY(series: ChartSeriesHost, clientY: number): number | null {
  try {
    const paneEl = series.getPane().getHTMLElement();
    if (!paneEl) return null;
    const y = clientY - paneEl.getBoundingClientRect().top;
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}
