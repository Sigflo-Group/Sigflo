import { describe, it, expect } from 'vitest';
import { buildTradeTimingUiModel } from '@/lib/tradeSetupExecutionModel';

describe('buildTradeTimingUiModel', () => {
  it('shows the Stretched warning for an overextended setup even when marketStatus has progressed to developing', () => {
    // Regression: deriveMarketStatus now reports 'developing' (not 'overextended') once an
    // overextended setup's lifecycle starts progressing, which previously hid the "poor
    // risk/reward" warning right when a user is most likely to chase a stretched entry.
    const ui = buildTradeTimingUiModel({
      inPosition: false,
      marketStatus: 'developing',
      executionQuality: null,
      isOverextendedSetup: true,
    });
    expect(ui.chipLabel).toBe('Stretched');
    expect(ui.chipState).toBe('invalid');
  });

  it('does not show the Stretched warning once an overextended setup has triggered', () => {
    const ui = buildTradeTimingUiModel({
      inPosition: false,
      marketStatus: 'triggered',
      executionQuality: null,
      isOverextendedSetup: true,
    });
    expect(ui.chipLabel).toBe('Triggered');
  });

  it('leaves non-overextended developing setups showing the generic Building chip', () => {
    const ui = buildTradeTimingUiModel({
      inPosition: false,
      marketStatus: 'developing',
      executionQuality: null,
      isOverextendedSetup: false,
    });
    expect(ui.chipLabel).toBe('Building');
  });

  it('still shows Late setup for a genuinely extended (post-trigger) setup', () => {
    const ui = buildTradeTimingUiModel({
      inPosition: false,
      marketStatus: 'extended',
      executionQuality: null,
    });
    expect(ui.chipLabel).toBe('Late setup');
  });
});
