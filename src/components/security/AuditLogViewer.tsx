import type { AuditLogEntry } from '@/types/security';

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  'exchange.link': { label: 'Exchange connected', icon: '🔗' },
  'exchange.switch': { label: 'Exchange switched', icon: '🔄' },
  'exchange.disconnect': { label: 'Exchange disconnected', icon: '🔌' },
  'exchange.revalidate': { label: 'Credentials revalidated', icon: '✓' },
  'exchange.activate': { label: 'Exchange activated', icon: '▶' },
  'exchange.key_rotation': { label: 'API key rotated', icon: '🔑' },
  'risk.acknowledge': { label: 'Risk terms accepted', icon: '📋' },
  'session.revoke': { label: 'Session revoked', icon: '🚫' },
  'trade.intent': { label: 'Trade intent created', icon: '📝' },
  'trade.execute': { label: 'Trade executed', icon: '⚡' },
};

type Props = {
  entries: AuditLogEntry[];
  loading?: boolean;
};

export function AuditLogViewer({ entries, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-sigflo-surface border border-white/6 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-white/6 bg-sigflo-surface p-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-sigflo-elevated flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-sigflo-muted" fill="none" viewBox="0 0 20 20">
            <path d="M5 4a1 1 0 011-1h8a1 1 0 011 1v12l-4-2-4 2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-sigflo-text">No activity yet</p>
        <p className="text-xs text-sigflo-muted mt-1">
          Security events will appear here as you use Sigflo.
        </p>
      </div>
    );
  }

  const grouped = groupByDate(entries);

  return (
    <div className="space-y-4">
      {grouped.map(({ label, entries: dayEntries }) => (
        <div key={label}>
          <div className="text-xs font-medium text-sigflo-muted mb-2 px-0.5">{label}</div>
          <div className="space-y-1.5">
            {dayEntries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, icon: '·' };
  const isFailure = entry.outcome === 'failure';
  const time = new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
      isFailure ? 'border-sigflo-loss/15 bg-sigflo-lossDim' : 'border-white/5 bg-sigflo-surface'
    }`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
        isFailure ? 'bg-sigflo-loss/15' : 'bg-sigflo-elevated'
      }`}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${isFailure ? 'text-sigflo-loss' : 'text-sigflo-text'}`}>
            {meta.label}
          </span>
          <span className="text-xs text-sigflo-muted flex-shrink-0">{time}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {entry.ipAddress && (
            <span className="text-xs text-sigflo-muted">{entry.ipAddress}</span>
          )}
          {isFailure && entry.metadata?.reason && (
            <span className="text-xs text-sigflo-loss/70 truncate">
              {String(entry.metadata.reason)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type DayGroup = { label: string; entries: AuditLogEntry[] };

function groupByDate(entries: AuditLogEntry[]): DayGroup[] {
  const groups = new Map<string, AuditLogEntry[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    let label: string;
    if (isSameDay(d, today)) {
      label = 'Today';
    } else if (isSameDay(d, yesterday)) {
      label = 'Yesterday';
    } else {
      label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    const group = groups.get(label) ?? [];
    group.push(entry);
    groups.set(label, group);
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
