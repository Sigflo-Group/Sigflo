/**
 * Bybit sometimes returns errors when TP/SL already match the requested values.
 * Treat as success so the API does not surface a false failure to the client.
 */
export function isBybitTradingStopNoopError(message: string): boolean {
  const m = message.toLowerCase().normalize('NFKC');
  return (
    m.includes('not modified') ||
    /\b34040\b/.test(m) ||
    m.includes('no need to modify') ||
    m.includes('nothing to modify')
  );
}
