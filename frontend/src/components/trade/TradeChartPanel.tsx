import type { ComponentProps } from 'react';
import { ChartHeader } from '@/components/trade/ChartHeader';
import { LiveMarketStrip } from '@/components/trade/LiveMarketStrip';

type ChartHeaderProps = ComponentProps<typeof ChartHeader>;

export type TradeChartPanelProps = ChartHeaderProps & {
  liveStrip?: ComponentProps<typeof LiveMarketStrip> | null;
};

/**
 * Chart region for trade screen: optional live strip + collapsible chart header.
 */
export function TradeChartPanel({ liveStrip, className = '', ...chartProps }: TradeChartPanelProps) {
  return (
    <div className={`flex min-h-0 w-full min-w-0 flex-col space-y-0 ${className}`}>
      {liveStrip ? <LiveMarketStrip {...liveStrip} /> : null}
      <ChartHeader {...chartProps} />
    </div>
  );
}
