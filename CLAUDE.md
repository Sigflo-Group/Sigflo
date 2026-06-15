# Sigflo — Project Notes for Claude

## Project Overview

Sigflo is a premium crypto trading platform focused on making trading understandable for everyday people. It targets non-professional traders and prioritises clarity, calmness, and reduced cognitive load over Bloomberg-terminal-style data density.

**Stack:** React + TypeScript + Vite + Tailwind. Backend: Node/Express + Bybit API. Exchange: Bybit (linear perpetuals).

**Core philosophy:** Translate market complexity into plain English. Reduce emotional trading decisions. Feel like a co-pilot, not a hype machine.

---

## Signal Engine (src/lib/signalDetectors.ts + related)

The signal engine runs **client-side** in `SignalEngineContext.tsx`. Key facts:

- **Detectors:** `breakoutPressureDetector`, `breakdownPressureDetector`, `pullbackContinuationDetector`, `pullbackContinuationShortDetector`, `overextendedDetector`, `overextendedShortDetector`
- **Candle pipeline:** WS fires only on confirmed (closed) 15m candles. REST bootstrap marks last candle `isClosed: false` so the pipeline strips it before running detectors.
- **Lifecycle system:** `evaluateTimingLifecycle` in `src/lib/timingLifecycle.ts`. Candle counting is **timestamp-based** (not array-index-based) because the ring-buffer is capped at 240 entries making index subtraction always 0. See `triggerCandleTs`, `peakTimingCandleTs`.
- **RSI guard:** `breakoutPressureDetector` hard-returns null when `rsiNow > 76`. `breakdownPressureDetector` hard-returns null when `rsiNow < 24`. This prevents co-activation with the overextended detector.
- **Overextended timing:** Uses `evaluateMeanReversionTiming` (not `reclaimTiming`). Triggers on RSI cooling from extreme, not EMA reclaim.
- **Continuation trigger:** `breakoutTiming.ts` has a `continuationMomentum` trigger (`trend_continuation_resume`) that re-arms an extended signal without waiting for full expiry.
- **Confidence caps:** Anti-spam caps in `assessDirectionalBias` halve the personality `chopPenalty`/`weakVolumePenalty` when those caps have already fired (prevents double-penalising the same condition).
- **5m confirmation:** `assessDirectionalBias` uses ≥20 closed 5m bars (when available) for lower-timeframe direction confirmation on breakout/pullback setups.
- **Config:** `src/lib/scannerEngineConfig.ts` centralises emit cooldown, warmup bars, regime detector thresholds, and funnel debug labels.
- **Single pipeline:** Live engine and `runScannerPipeline` / determinism checks both call `buildSignalFromMarket` (no duplicate `src/engine/detectors.ts`).
- **Signal book:** `pruneSignalBookForSymbol(symbol, keepKey)` retains the active setup while dropping stale competing keys for the same symbol.

**Debug:** `window.__SIGFLO_DEBUG__ = true` enables verbose detector/bias logging. `[DETECTOR LIFECYCLE]` logs lifecycle transitions in dev. Engine Debug screen shows pipeline funnel + "why not triggered" reasons via `getScannerPipelineHealth()`.

---

## UX / Presentation Layer

**Synthesis layer:** `src/lib/signalInterpretation.ts` — pure function `interpretSignal(signal, status)` that produces a `SignalInterpretation` with human-readable posture, confidence, chase risk, patience, RSI label, and action headline. No raw numbers in the default UI.

**MarketPostureBar:** `src/components/shared/MarketPostureBar.tsx` — the primary interpretation component. Three variants: `compact` (chips only), `headline` (chips + one sentence), `normal` (chips + headline + supporting note).

**Posture colour semantics:**
- Emerald → conditions open, act
- Cyan → forming, positive but not ready
- Amber → caution, stretched or fading
- Slate → wait, unclear

**Components that use the synthesis layer:**
- `SignalCard.tsx` — posture bar replaces raw confidence/risk numbers
- `ScannerInsightCard.tsx` — posture bar is the PRIMARY top element; bullets are collapsible secondary context
- `SetupContextCard.tsx` — fully rewritten; low-data state shows "Waiting for more history"

**Language rules (always enforce):**
- Never show raw RSI numbers in user-facing UI → use `interpretSignal().rsiLabel`
- Never show raw ATR numbers in user-facing UI
- Empty/null states → use `emptyMetricLabel()` from `signalInterpretation.ts`
- Avoid: "closed bar engine", "trigger threshold", "mean reversion evaluator"
- Use: "Momentum building", "Trend stretched", "Pullback not confirmed yet"

---

## Lifecycle Store Persistence

`lifecycleRef` in `SignalEngineContext.tsx` is persisted to localStorage under key `__SIGFLO_LIFECYCLE_REF_V2__`. This preserves trigger timestamps and peak tracking across page reloads. The `V2` suffix is intentional — V1 used broken array-index counting.

Other localStorage keys:
- `__SIGFLO_MARKET_MEMORY_V1__`
- `__SIGFLO_SIGNAL_LIFECYCLE_V1__`
- `__SIGFLO_USER_ADAPTATION_V1__`
- `__SIGFLO_PRO_INTELLIGENCE_PREFS_V1__`
- `__SIGFLO_LIFECYCLE_REF_V2__`

---

## Testing

**Framework:** Vitest (`npm test` or `npx vitest run`).  
**Test file:** `src/lib/__tests__/timingLifecycle.test.ts` — 9 tests covering lifecycle state transitions, timestamp-based candle counting, peak tracking tie-reset fix, stale trigger clearing, continuation trigger, pullback evaluator type isolation, and mean-reversion evaluator.

Key test facts learned from writing the tests:
- `extendedAfterCandles (5) < expiredAfterCandles (8)` → extended is reached via timing score drop or candle count; stale triggers clear after 8 bars without re-hit.
- `candlesSinceTrigger` correctly increments (timestamp-based), but the stale-trigger clear fires at tick 6 without a re-confirmation.

---

## Future: AI Assistant System

**Status:** Planned — not yet in production. Full architecture document was designed in this session.

**Core vision:** A persistent, context-aware co-pilot that makes every screen of Sigflo more comprehensible. Not a chatbot — a grounded interpretation layer over the signal engine and position data.

**Tone:** Calm, precise, honest about uncertainty. Never predicts price. Says "I don't know" when data is thin. Detects emotional trading patterns and responds with grounding rather than more analysis.

### Planned Phases

**Phase 0 (now):** Standardise existing AI calls (`requestAssistantSuggestion`, `MarketDeepAnalysisSheet`) to a shared `AssistantResponse` schema with `confidence`, `groundingSource`, and safety-checked output.

**Phase 1 (weeks 4–12):** Tap-to-explain for any metric, persistent signal explanation flow with session memory, inline risk flags at -5% P&L, regime shift notifications.

**Phase 2 (months 3–6):** Floating assistant bubble (idle/alert/responding states), command center full-screen conversation view, context-aware quick-tap questions, watchlist monitoring push, emotional behavior detection with grounding mode, MarketScannerAgent + RiskAgent.

**Phase 3 (months 6–12):** Full agent ecosystem — ExitAgent, PortfolioAgent, JournalAgent, SentimentAgent, local model (Phi-3/Gemma via WASM) for tap-to-explain, scenario framing, weekly pattern feedback.

**Phase 4 (months 12–18):** Regime early warning, adaptive tone calibration, voice (push-to-talk, Whisper STT), multi-account portfolio synthesis.

### Architecture Summary

```
AssistantClient (React context + WebSocket)
  → AssistantGateway (auth, rate limit)
    → Orchestrator (intent → agent routing → safety check)
      → ContextEngine (deterministic context snapshot assembly)
      → Agent (SignalExplanation / Risk / Portfolio / Exit / Journal)
      → RuleEngine (pre + post generation safety gates)
      → LLM (structured JSON output only, never free prose)
      → Memory (session + persistent per-user)
  → EventPipeline (Redis Streams: signal.triggered, regime.changed, position.pnl_threshold)
```

### Safety Rules (non-negotiable)

- Every LLM response is structured JSON validated against `AssistantResponse` schema
- `groundingSource` must be populated — empty source = blocked response
- Post-generation rule engine strips: price predictions, certainty language ("will", "guaranteed"), leverage advice
- Confidence 0 = single standard "not enough data" response, no LLM fallback to training knowledge
- No sentiment scrapers, no social comparison, no trade copy, no P&L gamification

### Key Design Decisions

- **Pull-first, push only when critical** — assistant surfaces context when asked; proactive push reserved for risk warnings, lifecycle changes on open positions, regime shifts
- **Local model for high-volume low-complexity** — tap-to-explain never hits the cloud API (Phase 3)
- **Context snapshot freshness enforcement** — market data > 60s old is flagged as stale in the response
- **Three-tier model selection:** local (explain single metric) → Haiku (signal explanation) → Sonnet (complex multi-turn)

### What NOT to Build

Price prediction, social media sentiment, trade copy features, social P&L comparison, leaderboards, always-listening voice activation, automated trade execution.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/lib/signalDetectors.ts` | 6 detectors + `buildSignalFromMarket` + `assessDirectionalBias` |
| `src/lib/timingLifecycle.ts` | Lifecycle state transitions, timestamp-based candle counting |
| `src/lib/timingEvaluators/breakoutTiming.ts` | Breakout + continuation trigger logic |
| `src/lib/timingEvaluators/meanReversionTiming.ts` | Overextended setup timing (RSI cooling trigger) |
| `src/lib/signalInterpretation.ts` | UX synthesis layer — raw → human language |
| `src/lib/indicators.ts` | RSI, ATR, EMA, rollingAvg, swingHigh/Low |
| `src/lib/scannerConfig.ts` | `SCANNER_LIFECYCLE_CONFIG` — all timing thresholds |
| `src/lib/strategyPersonality.ts` | 5 personality profiles with confidence adjustments |
| `src/lib/marketScannerRows.ts` | `deriveMarketStatus`, row building, signal selection |
| `src/context/SignalEngineContext.tsx` | Engine orchestration, WS/REST, cooldown/emit logic |
| `src/components/shared/MarketPostureBar.tsx` | Primary posture interpretation component |
| `src/components/feed/SignalCard.tsx` | Feed card with posture bar |
| `src/components/trade/ScannerInsightCard.tsx` | Trade panel — posture first, bullets secondary |
| `src/components/trade/SetupContextCard.tsx` | Compact trade context card |
| `src/services/bybit/client.ts` | `fetchKlines` (marks last candle `isClosed: false`) |
| `src/lib/__tests__/timingLifecycle.test.ts` | Vitest lifecycle tests |
| `vitest.config.ts` | Test runner config |
