import type { CryptoSignal } from '@/types/signal';

export type WhyThisTradeModel = {
  bias: string;
  confidence: number;
  setupQuality: number;
  higherTimeframeBias: 'bullish' | 'bearish' | 'neutral';
  primaryDriver: string | null;
  secondaryDrivers: string[];
  minorFactors: string[];
  bullishFactors: string[];
  bearishFactors: string[];
  risks: string[];
  invalidation: string[];
};

function uniqueStrings(items: string[]): string[] {
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    if (!out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
  }
  return out;
}

function normalizeBiasLabel(signal: CryptoSignal): string {
  const db = signal.directionalBias;
  if (db === 'strong_long') return 'Strong Bullish';
  if (db === 'long') return 'Moderate Bullish';
  if (db === 'weak_long') return 'Developing Bullish';
  if (db === 'strong_short') return 'Strong Bearish';
  if (db === 'short') return 'Moderate Bearish';
  if (db === 'weak_short') return 'Developing Bearish';
  if (signal.setupScore >= 85) return 'High Conviction';
  if (signal.setupScore >= 75) return signal.side === 'long' ? 'Strong Bullish' : 'Strong Bearish';
  if (signal.setupScore >= 60) return signal.side === 'long' ? 'Moderate Bullish' : 'Moderate Bearish';
  if (signal.setupScore >= 45) return signal.side === 'long' ? 'Developing Bullish' : 'Developing Bearish';
  return 'No Trade / Unclear';
}

function defaultInvalidation(signal: CryptoSignal): string[] {
  const side = signal.side;
  if (signal.setupType === 'breakout') {
    return side === 'long'
      ? ['Failed breakout retest below trigger zone', 'Break below EMA support cluster']
      : ['Failed breakdown retest above trigger zone', 'Break above EMA resistance cluster'];
  }
  if (signal.setupType === 'pullback') {
    return side === 'long'
      ? ['Loss of pullback support structure', 'Lower low after attempted continuation']
      : ['Loss of pullback resistance structure', 'Higher high after attempted continuation'];
  }
  return side === 'long'
    ? ['Momentum collapse after extension', 'Rejection from resistance with rising sell pressure']
    : ['Momentum squeeze after extension', 'Reclaim above resistance with rising buy pressure'];
}

export function buildWhyThisTradeModel(
  signal: CryptoSignal,
  options?: { stopPrice?: number | null },
): WhyThisTradeModel {
  const reasons = uniqueStrings(signal.reasons ?? []);
  const warnings = uniqueStrings(signal.warnings ?? []);
  const side = signal.side;
  const confidence = Math.round(signal.confidence ?? signal.setupScore);
  const setupQuality = Math.round(signal.setupQuality ?? signal.setupScore);
  const higherTimeframeBias = signal.higherTimeframeBias ?? signal.facts?.higherTimeframeBias ?? 'neutral';

  const directionalDrivers = reasons.length > 0 ? reasons : [signal.aiExplanation];
  const primaryDriver = directionalDrivers[0] ?? null;
  const secondaryDrivers = directionalDrivers.slice(1, 3);
  const minorFactors = directionalDrivers.slice(3, 5);

  const bullishFactors =
    side === 'long'
      ? directionalDrivers.slice(0, 4)
      : uniqueStrings([
          ...(higherTimeframeBias === 'bullish' ? ['Higher timeframe remains structurally bullish.'] : []),
          ...(reasons.slice(0, 2).map((r) => `Counter-signals: ${r}`)),
        ]).slice(0, 4);

  const bearishFactors =
    side === 'short'
      ? directionalDrivers.slice(0, 4)
      : uniqueStrings([
          ...(higherTimeframeBias === 'bearish' ? ['Higher timeframe remains structurally bearish.'] : []),
          ...(warnings.slice(0, 3)),
        ]).slice(0, 4);

  const risks = uniqueStrings([
    ...warnings,
    ...(confidence < 60 ? ['Confirmation remains incomplete at current confidence.'] : []),
    ...(signal.riskLevel === 'high' ? ['Risk conditions remain elevated versus average setups.'] : []),
  ]).slice(0, 5);

  const invalidation = uniqueStrings([
    ...defaultInvalidation(signal),
    ...(options?.stopPrice != null && Number.isFinite(options.stopPrice) && options.stopPrice > 0
      ? [
          side === 'long'
            ? `Break below invalidation level near ${options.stopPrice.toLocaleString('en-US', { maximumFractionDigits: 6 })}`
            : `Break above invalidation level near ${options.stopPrice.toLocaleString('en-US', { maximumFractionDigits: 6 })}`,
        ]
      : []),
    ...(higherTimeframeBias !== 'neutral'
      ? [`Higher timeframe shifts away from current ${higherTimeframeBias} bias`]
      : []),
  ]).slice(0, 5);

  return {
    bias: normalizeBiasLabel(signal),
    confidence,
    setupQuality,
    higherTimeframeBias,
    primaryDriver,
    secondaryDrivers,
    minorFactors,
    bullishFactors,
    bearishFactors,
    risks,
    invalidation,
  };
}
