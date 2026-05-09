import type { StrategyPersonalityMode } from '@/lib/strategyPersonality';
import type { CryptoSignal, SignalLifecycleEvent, SignalOutcome, SignalSetupType } from '@/types/signal';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

type FeedbackBySetup = {
  samples: number;
  wins: number;
  losses: number;
  neutrals: number;
  fakeouts: number;
  avgQuality: number;
};

export type OutcomeAdaptiveFeedback = {
  confidenceAdjustment: number;
  tightenConfirmation: boolean;
  allowEarlierRecognition: boolean;
  notes: string[];
};

export type SignalLifecycleTrackerStore = {
  events: SignalLifecycleEvent[];
  feedbackBySymbolSetup: Record<string, FeedbackBySetup>;
  generatedInsights: Array<{ ts: number; symbol: string; setupType: SignalSetupType; insight: string }>;
};

const MAX_EVENTS = 300;
const ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function keyOf(symbol: string, setupType: SignalSetupType): string {
  return `${symbol}:${setupType}`;
}

function signedMove(event: SignalLifecycleEvent, price: number): number {
  if (event.bias === 'long') return (price - event.entryContext.entryPrice) / Math.max(1e-8, event.entryContext.atrAtCreation);
  return (event.entryContext.entryPrice - price) / Math.max(1e-8, event.entryContext.atrAtCreation);
}

function adverseMove(event: SignalLifecycleEvent, price: number): number {
  if (event.bias === 'long') return (event.entryContext.entryPrice - price) / Math.max(1e-8, event.entryContext.atrAtCreation);
  return (price - event.entryContext.entryPrice) / Math.max(1e-8, event.entryContext.atrAtCreation);
}

function classifyOutcome(args: {
  event: SignalLifecycleEvent;
  price: number;
  now: number;
  candleTs: number;
}): { status: SignalLifecycleEvent['status']; outcome: SignalOutcome | null; done: boolean; note?: string } {
  const { event, price, now, candleTs } = args;
  const favorableAtr = signedMove(event, price);
  const adverseAtr = adverseMove(event, price);
  const ageMs = now - event.timestamp;
  const invalidated = event.bias === 'long' ? price <= event.invalidationLevel : price >= event.invalidationLevel;
  const targetHit = event.bias === 'long' ? price >= event.targetLevel : price <= event.targetLevel;
  if (targetHit) return { status: 'completed', outcome: 'win', done: true };
  if (invalidated) {
    const fakeout = event.maxFavorableExcursion >= 0.6;
    return {
      status: 'failed',
      outcome: 'loss',
      done: true,
      note: fakeout ? 'Confirmed fakeout: initial move failed to hold follow-through.' : 'Invalidation was hit before continuation confirmed.',
    };
  }
  if (favorableAtr >= 0.9) return { status: 'confirmed', outcome: null, done: false };
  if (favorableAtr >= 0.5) return { status: 'evolving', outcome: null, done: false };
  if (favorableAtr >= 0.2) return { status: 'active', outcome: null, done: false };
  if (adverseAtr >= 0.65) return { status: 'rejected', outcome: null, done: false };
  if (ageMs >= 18 * 60 * 60 * 1000 || candleTs - event.timestamp >= 72 * 60 * 1000) {
    const net = favorableAtr - adverseAtr;
    if (Math.abs(net) < 0.25 && event.maxFavorableExcursion < 0.5) {
      return { status: 'completed', outcome: 'neutral', done: true, note: 'Sideways chop persisted without meaningful resolution.' };
    }
  }
  return { status: event.status, outcome: null, done: false };
}

function computeQualityScore(event: SignalLifecycleEvent): number {
  const directionAccuracy =
    event.outcome === 'win' ? 92 : event.outcome === 'loss' ? 28 : 54;
  const timingQuality = clamp(60 + event.maxFavorableExcursion * 18 - event.maxAdverseExcursion * 14, 0, 100);
  const structureValidity = event.status === 'confirmed' || event.status === 'completed' ? 72 : 52;
  const volatilityFit = clamp(65 + Math.min(1.2, event.maxFavorableExcursion) * 12, 30, 92);
  const fakeoutResistance = clamp(80 - Math.max(0, event.maxAdverseExcursion - 0.35) * 45, 20, 95);
  const followThrough = clamp(50 + event.maxFavorableExcursion * 24, 0, 100);
  return Math.round(
    directionAccuracy * 0.28 +
      timingQuality * 0.18 +
      structureValidity * 0.16 +
      volatilityFit * 0.12 +
      fakeoutResistance * 0.12 +
      followThrough * 0.14,
  );
}

function aggregateFeedback(events: SignalLifecycleEvent[]): Record<string, FeedbackBySetup> {
  const map: Record<string, FeedbackBySetup> = {};
  for (const e of events) {
    if (e.outcome == null) continue;
    const key = keyOf(e.symbol, e.setupType);
    const row = map[key] ?? { samples: 0, wins: 0, losses: 0, neutrals: 0, fakeouts: 0, avgQuality: 0 };
    row.samples += 1;
    if (e.outcome === 'win') row.wins += 1;
    else if (e.outcome === 'loss') row.losses += 1;
    else row.neutrals += 1;
    if (e.notes.some((n) => n.toLowerCase().includes('fakeout'))) row.fakeouts += 1;
    row.avgQuality += e.qualityScore ?? 50;
    map[key] = row;
  }
  for (const key of Object.keys(map)) {
    const row = map[key]!;
    row.avgQuality = row.samples > 0 ? Math.round(row.avgQuality / row.samples) : 50;
  }
  return map;
}

export function createEmptySignalLifecycleTracker(): SignalLifecycleTrackerStore {
  return { events: [], feedbackBySymbolSetup: {}, generatedInsights: [] };
}

export function registerSignalLifecycleEvent(args: {
  store: SignalLifecycleTrackerStore;
  signal: CryptoSignal;
  symbol: string;
  atrNow: number;
  now: number;
  /** Observational: active personality mode at emit (does not alter detection). */
  strategyPersonalityMode: StrategyPersonalityMode;
}): SignalLifecycleTrackerStore {
  const entry = args.signal.idealEntryPrice ?? args.signal.plannedEntry ?? 0;
  if (!(entry > 0) || !(args.atrNow > 0)) return args.store;
  const invalidationDistanceAtr = args.signal.setupType === 'overextended' ? 0.9 : 1.05;
  const targetDistanceAtr = args.signal.setupType === 'breakout' ? 1.7 : args.signal.setupType === 'pullback' ? 1.4 : 1.1;
  const invalidation =
    args.signal.side === 'long' ? entry - args.atrNow * invalidationDistanceAtr : entry + args.atrNow * invalidationDistanceAtr;
  const target =
    args.signal.side === 'long' ? entry + args.atrNow * targetDistanceAtr : entry - args.atrNow * targetDistanceAtr;

  const event: SignalLifecycleEvent = {
    id: `${args.signal.id}-evt`,
    timestamp: args.now,
    symbol: args.symbol,
    timeframe: '15m',
    bias: args.signal.side,
    confidence: args.signal.confidence ?? args.signal.setupScore,
    setupType: args.signal.setupType,
    entryContext: {
      entryPrice: entry,
      atrAtCreation: args.atrNow,
      marketRegime: args.signal.marketState?.regime,
    },
    invalidationLevel: invalidation,
    targetLevel: target,
    status: 'emerging',
    outcome: null,
    maxFavorableExcursion: 0,
    maxAdverseExcursion: 0,
    qualityScore: null,
    notes: ['Signal created and queued for lifecycle monitoring.'],
    strategyPersonalityMode: args.strategyPersonalityMode,
  };

  const events = [...args.store.events, event].slice(-MAX_EVENTS);
  return { ...args.store, events };
}

export function updateSignalLifecycleOutcomes(args: {
  store: SignalLifecycleTrackerStore;
  symbol: string;
  price: number;
  now: number;
  candleTs: number;
}): SignalLifecycleTrackerStore {
  const events: SignalLifecycleEvent[] = args.store.events.map((event) => {
    if (event.symbol !== args.symbol) return event;
    if (event.status === 'completed' || event.status === 'failed' || event.status === 'archived') return event;
    const favorable = signedMove(event, args.price);
    const adverse = adverseMove(event, args.price);
    const nextMfe = Math.max(event.maxFavorableExcursion, favorable);
    const nextMae = Math.max(event.maxAdverseExcursion, adverse);
    const classification = classifyOutcome({
      event: { ...event, maxFavorableExcursion: nextMfe, maxAdverseExcursion: nextMae },
      price: args.price,
      now: args.now,
      candleTs: args.candleTs,
    });
    const notes = [...event.notes];
    if (classification.note) notes.push(classification.note);
    const base: SignalLifecycleEvent = {
      ...event,
      status: classification.status,
      outcome: classification.outcome ?? event.outcome,
      maxFavorableExcursion: nextMfe,
      maxAdverseExcursion: nextMae,
      notes,
    };
    if (classification.done) {
      return {
        ...base,
        completedAt: args.now,
        qualityScore: computeQualityScore(base),
        status: 'completed' as const,
      };
    }
    return base;
  }).map((event) => {
    if (event.status !== 'completed') return event;
    if (args.now - (event.completedAt ?? event.timestamp) > ARCHIVE_AFTER_MS) {
      return { ...event, status: 'archived' };
    }
    return event;
  });

  const feedbackBySymbolSetup = aggregateFeedback(events.slice(-220));
  const generatedInsights = [...args.store.generatedInsights];
  const recentCompleted = events.filter((e) => e.symbol === args.symbol && e.outcome != null).slice(-8);
  if (recentCompleted.length >= 4) {
    const losses = recentCompleted.filter((e) => e.outcome === 'loss').length;
    const fakeouts = recentCompleted.filter((e) => e.notes.some((n) => n.toLowerCase().includes('fakeout'))).length;
    const key = keyOf(args.symbol, recentCompleted.at(-1)!.setupType);
    const lastInsightTs = generatedInsights.filter((i) => i.symbol === args.symbol).at(-1)?.ts ?? 0;
    if (args.now - lastInsightTs > 30 * 60 * 1000) {
      if (fakeouts >= 2) {
        generatedInsights.push({
          ts: args.now,
          symbol: args.symbol,
          setupType: recentCompleted.at(-1)!.setupType,
          insight: 'Recent fakeouts suggest tightening confirmation requirements before breakout entries.',
        });
      } else if (losses >= 3) {
        generatedInsights.push({
          ts: args.now,
          symbol: args.symbol,
          setupType: recentCompleted.at(-1)!.setupType,
          insight: 'Recent continuation attempts underperformed; caution is increased for similar setups.',
        });
      } else {
        const fb = feedbackBySymbolSetup[key];
        if (fb && fb.samples >= 4 && fb.wins / fb.samples >= 0.65) {
          generatedInsights.push({
            ts: args.now,
            symbol: args.symbol,
            setupType: recentCompleted.at(-1)!.setupType,
            insight: 'Continuation structure is improving; early recognition can be slightly more responsive.',
          });
        }
      }
    }
  }

  return {
    events: events.slice(-MAX_EVENTS),
    feedbackBySymbolSetup,
    generatedInsights: generatedInsights.slice(-80),
  };
}

export function deriveAdaptiveFeedback(
  store: SignalLifecycleTrackerStore,
  symbol: string,
  setupType: SignalSetupType,
): OutcomeAdaptiveFeedback {
  const row = store.feedbackBySymbolSetup[keyOf(symbol, setupType)];
  if (!row || row.samples < 3) {
    return {
      confidenceAdjustment: 0,
      tightenConfirmation: false,
      allowEarlierRecognition: false,
      notes: [],
    };
  }
  const winRate = row.wins / Math.max(1, row.samples);
  const fakeoutRate = row.fakeouts / Math.max(1, row.samples);
  let confidenceAdjustment = 0;
  const notes: string[] = [];
  let tightenConfirmation = false;
  let allowEarlierRecognition = false;
  if (winRate < 0.35) {
    confidenceAdjustment -= 8;
    tightenConfirmation = true;
    notes.push('Recent outcomes are weak for this setup/timeframe cluster.');
  } else if (winRate < 0.5) {
    confidenceAdjustment -= 4;
    notes.push('Recent performance is mixed; confidence moderated.');
  } else if (winRate > 0.68 && row.samples >= 5) {
    confidenceAdjustment += 4;
    allowEarlierRecognition = true;
    notes.push('Recent continuation quality improved for this setup cluster.');
  }
  if (fakeoutRate >= 0.3) {
    confidenceAdjustment -= 4;
    tightenConfirmation = true;
    notes.push('Fakeout frequency is elevated; confirmation threshold tightened.');
  }
  if (row.avgQuality < 50) confidenceAdjustment -= 2;
  if (row.avgQuality > 72) confidenceAdjustment += 2;
  return {
    confidenceAdjustment: clamp(confidenceAdjustment, -14, 8),
    tightenConfirmation,
    allowEarlierRecognition,
    notes: notes.slice(0, 3),
  };
}

