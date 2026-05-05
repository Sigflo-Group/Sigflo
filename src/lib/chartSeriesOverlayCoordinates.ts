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
 * Map price → Y in the same coordinate system as `plotEl` (chart container), for HTML stacked on the chart.
 * lightweight-charts v5+ reports `priceToCoordinate` in the series pane; add the pane's offset inside `plotEl`.
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
