/** Dispatched on `window` so any mounted `PriceChartCard` can react without prop drilling. */
export const CHART_SETUP_FOCUS_EVENT = 'sigflo-chart-setup-focus';

export type ChartSetupFocusDetail = {
  /** When set, only the chart for this pair reacts (e.g. `BTC/USDT`). */
  pairFilter?: string;
  /** Shown in the optional banner: "Viewing {botName} setup". */
  botName?: string;
};

export function requestChartSetupFocus(detail: ChartSetupFocusDetail = {}): void {
  try {
    window.dispatchEvent(new CustomEvent<ChartSetupFocusDetail>(CHART_SETUP_FOCUS_EVENT, { detail }));
  } catch {
    /* ignore */
  }
}
