import type { SignalLifecycleEvent } from '@/types/signal';
import type { SystemEventModel } from '@/types/botSystem';

function lifecycleSeverity(ev: SignalLifecycleEvent): SystemEventModel['severity'] {
  if (ev.outcome === 'win') return 'success';
  if (ev.outcome === 'loss') return 'warning';
  if (ev.status === 'rejected' || ev.status === 'failed') return 'warning';
  if (ev.status === 'completed') return 'success';
  if (ev.status === 'confirmed' || ev.status === 'active') return 'info';
  return 'info';
}

function lifecycleMessage(ev: SignalLifecycleEvent): string {
  const pair = ev.symbol.replace('USDT', '/USDT');
  if (ev.status === 'completed') return `${pair} setup completed (${ev.outcome ?? 'neutral'})`;
  if (ev.status === 'confirmed' || ev.status === 'active') return `${pair} signal active — ${ev.bias} bias`;
  if (ev.status === 'rejected' || ev.status === 'failed') return `${pair} setup ${ev.status}`;
  return `${pair} signal ${ev.status}`;
}

export function deriveSystemEvents(lifecycleEvents: SignalLifecycleEvent[]): SystemEventModel[] {
  return lifecycleEvents.map((ev) => ({
    id: ev.id,
    timestamp: new Date(ev.timestamp).toISOString(),
    eventType: 'engine',
    severity: lifecycleSeverity(ev),
    message: lifecycleMessage(ev),
    relatedPair: ev.symbol.replace('USDT', '/USDT'),
  }));
}

export const mockSystemEvents: SystemEventModel[] = [];

/** Shown when there are no system events yet. */
export const EMPTY_SYSTEM_EVENTS_MESSAGE = 'No system events yet — they appear here as engines scan and signals progress.';
