export const ATTRIBUTION_REGIMES = ['trend', 'range', 'volatile', 'compression'] as const;
export type AttributionRegime = (typeof ATTRIBUTION_REGIMES)[number];
