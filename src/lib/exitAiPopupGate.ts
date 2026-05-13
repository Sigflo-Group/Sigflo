import type { ExitAutomationActivityKind } from '@/types/aiExitAutomation';

/** Suppress global Exit AI toasts for stale / non-actionable log lines (e.g. after position is flat). */
export function isActionableExitAiPopupMessage(entry: {
  kind: ExitAutomationActivityKind;
  message: string;
}): boolean {
  const msg = entry.message.toLowerCase();
  if (
    msg.includes('no exchange position') ||
    msg.includes('connect bybit') ||
    msg.includes('no live position') ||
    msg.includes('no position on this pair') ||
    msg.includes('no matching open position')
  ) {
    return false;
  }
  if (entry.kind === 'assisted_ready') {
    if (!(msg.includes('submitting') || msg.includes('confirm') || msg.includes('prepared'))) return false;
  }
  return true;
}
