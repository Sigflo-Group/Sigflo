import { useState } from 'react';
import GuidedExecutionPanel, { type GuidedExecutionSetup } from '@/components/trade/GuidedExecutionPanel';

const mockSetup: GuidedExecutionSetup = {
  symbol: 'BTC/USDT',
  direction: 'long',
  statusLabel: 'In Play',
  setupScore: 72,
  setupLabel: 'Structured',
  rationale: 'Conditions aligned across trend, momentum, and structure.',
  entry: 67250.25,
  stop: 67115.75,
  target: 67680.4,
  positionSizeUsd: 1200,
  leverage: 6,
  estimatedMarginUsd: 200,
  liquidationBufferPct: 14.2,
  riskRewardRatio: 2.35,
};

export function GuidedExecutionPanelExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-[#00ffc8]/30 bg-[#00ffc8]/12 px-4 py-2 text-sm font-semibold text-[#bafef1]"
      >
        Open Guided Execution
      </button>
      <GuidedExecutionPanel
        open={open}
        setup={mockSetup}
        onClose={() => setOpen(false)}
        onExecute={async () => {
          await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
        }}
        onViewPosition={() => {
          setOpen(false);
        }}
      />
    </div>
  );
}

export default GuidedExecutionPanelExample;
