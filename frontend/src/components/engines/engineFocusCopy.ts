/** Plain-English focus lines for engine detail (mock / product copy). */
export const ENGINE_FOCUS_BY_ID: Record<string, string> = {
  'eng-nova': 'Looks for tight ranges breaking out, volume expansion, and trend continuation.',
  'eng-rio': 'Looks for exhaustion, failed moves, and reversal confirmation.',
  'eng-pulse': 'Looks for momentum continuation and active trend strength.',
  'eng-guard': 'Monitors risk, exposure, and execution safety.',
};

export function engineFocusLine(engineId: string): string {
  return (
    ENGINE_FOCUS_BY_ID[engineId] ??
    'Scans live market structure and surfaces setups when conditions align with this engine’s rules.'
  );
}
