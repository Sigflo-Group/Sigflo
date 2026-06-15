import { describe, it, expect } from 'vitest';
import { evaluateEmitGate, ENGINE_EMIT_CONFIG } from '@/lib/scannerEngineConfig';

describe('evaluateEmitGate', () => {
  const base = {
    now: 1_700_000_000_000,
    signalSetupScore: 72,
    priceNow: 100,
    atrNow: 2,
    lastClosedTs: 1_699_999_000_000,
    prevCandleTs: 1_699_998_000_000,
  };

  it('emits on first signal (no previous emit)', () => {
    const gate = evaluateEmitGate({ ...base, prev: undefined });
    expect(gate.emit).toBe(true);
    expect(gate.cooldownPassed).toBe(true);
  });

  it('suppresses duplicate emit inside cooldown on same bar', () => {
    const gate = evaluateEmitGate({
      ...base,
      prev: { emittedAt: base.now - 60_000, setupScore: 70, refPrice: 99.5, atr: 2 },
    });
    expect(gate.emit).toBe(false);
    expect(gate.cooldownPassed).toBe(false);
    expect(gate.scoreImproved).toBe(false);
    expect(gate.priceMoved).toBe(false);
  });

  it('allows emit when setup score improves materially on a new closed bar', () => {
    const gate = evaluateEmitGate({
      ...base,
      signalSetupScore: 78,
      prev: { emittedAt: base.now - 60_000, setupScore: 70, refPrice: 100, atr: 2 },
    });
    expect(gate.scoreImproved).toBe(true);
    expect(gate.emit).toBe(true);
  });

  it('allows emit when price moves beyond ATR threshold on a new closed bar', () => {
    const gate = evaluateEmitGate({
      ...base,
      priceNow: 102,
      prev: { emittedAt: base.now - 60_000, setupScore: 72, refPrice: 100, atr: 2 },
    });
    expect(gate.priceMoved).toBe(true);
    expect(gate.emit).toBe(true);
  });

  it('does not bypass cooldown on same candle timestamp', () => {
    const gate = evaluateEmitGate({
      ...base,
      lastClosedTs: 1_699_999_000_000,
      prevCandleTs: 1_699_999_000_000,
      signalSetupScore: 90,
      priceNow: 110,
      prev: { emittedAt: base.now - 60_000, setupScore: 70, refPrice: 100, atr: 2 },
    });
    expect(gate.newClosedBar).toBe(false);
    expect(gate.scoreImproved).toBe(false);
    expect(gate.priceMoved).toBe(false);
    expect(gate.emit).toBe(false);
  });

  it('respects custom cooldown from personality multiplier', () => {
    const gate = evaluateEmitGate({
      ...base,
      cooldownMs: ENGINE_EMIT_CONFIG.cooldownMs * 2,
      prev: { emittedAt: base.now - ENGINE_EMIT_CONFIG.cooldownMs, setupScore: 70, refPrice: 100, atr: 2 },
    });
    expect(gate.cooldownPassed).toBe(false);
    expect(gate.emit).toBe(false);
  });
});
