import type { ComponentProps } from 'react';
import { PriceChartCard } from '@/components/trade/PriceChartCard';
import { TRADE_CHART_PLOT_COLLAPSED_PX, TRADE_CHART_PLOT_EXPANDED_PX } from '@/config/tradeChartHeights';

export type ChartHeaderProps = Omit<ComponentProps<typeof PriceChartCard>, 'chartPlotHeightPx'> & {
  collapsed: boolean;
  plotExpandedPx?: number;
  plotCollapsedPx?: number;
  /** Wraps the chart card; default `max-w-lg` matches most app screens. */
  chartWrapClassName?: string;
  /** Plot grows to fill parent height (bot focus full-chart); avoids clipping from underestimated chrome reserve. */
  chartPlotFlexFill?: boolean;
};

/**
 * Sticky trade chart block with a collapsible plot height driven by scroll on `.trade-scroll`.
 * Forwards interval, `setupMode`, and timing props into `PriceChartCard`.
 */
export function ChartHeader({
  collapsed,
  plotExpandedPx = TRADE_CHART_PLOT_EXPANDED_PX,
  plotCollapsedPx = TRADE_CHART_PLOT_COLLAPSED_PX,
  chartWrapClassName = 'mx-auto w-full max-w-lg px-1.5',
  chartPlotFlexFill = false,
  className = '',
  ...chartProps
}: ChartHeaderProps & { className?: string }) {
  const plotH = collapsed ? plotCollapsedPx : plotExpandedPx;
  return (
    <div className={`w-full min-w-0 ${chartPlotFlexFill ? 'flex min-h-0 min-w-0 flex-1 flex-col' : ''} ${className}`}>
      <div className={`min-w-0 ${chartWrapClassName} ${chartPlotFlexFill ? 'flex min-h-0 min-w-0 flex-1 flex-col' : ''}`}>
        <PriceChartCard
          {...chartProps}
          chartPlotFlexFill={chartPlotFlexFill}
          chartPlotHeightPx={chartPlotFlexFill ? undefined : plotH}
          chartHeightPx={plotH}
        />
      </div>
    </div>
  );
}
