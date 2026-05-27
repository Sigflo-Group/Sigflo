import { useState, useCallback } from 'react';
import { auditExchangePermissions } from '@/services/api/securityClient';
import type { PermissionAuditResult, PermissionRisk } from '@/types/security';
import type { IntegrationStatus } from '@/types/integrations';

type Props = {
  account: IntegrationStatus;
  onAuditComplete?: (result: PermissionAuditResult) => void;
};

const RISK_STYLES: Record<PermissionRisk, { border: string; bg: string; badge: string; dot: string; label: string }> = {
  ok: {
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Permissions look good',
  },
  warning: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-400',
    dot: 'bg-amber-400',
    label: 'Review recommended',
  },
  critical: {
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/15 text-red-400',
    dot: 'bg-red-400',
    label: 'Action required',
  },
};

export function PermissionStatusCard({ account, onAuditComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PermissionAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditExchangePermissions(account.id);
      setResult(res.audit);
      onAuditComplete?.(res.audit);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Permission check failed.');
    } finally {
      setLoading(false);
    }
  }, [account.id, onAuditComplete]);

  const style = result ? RISK_STYLES[result.overallRisk] : null;

  return (
    <div className={`rounded-xl border p-4 transition-all ${style ? `${style.border} ${style.bg}` : 'border-white/6 bg-sigflo-surface'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-sigflo-text capitalize">
              {account.exchange}
            </span>
            {account.accountLabel && (
              <span className="text-xs text-sigflo-muted">· {account.accountLabel}</span>
            )}
            {result && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style!.badge}`}>
                {style!.label}
              </span>
            )}
          </div>
          {account.lastValidatedAt && (
            <p className="text-xs text-sigflo-muted mt-0.5">
              Last validated {formatRelativeTime(account.lastValidatedAt)}
            </p>
          )}
        </div>
        <button
          onClick={runAudit}
          disabled={loading}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-sigflo-elevated border border-white/8 text-sigflo-muted hover:text-sigflo-text hover:border-white/16 transition-all disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check permissions'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-sigflo-loss">{error}</p>
      )}

      {result && result.flags.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {result.flags.map((flag) => (
            <div key={flag.code} className={`p-3 rounded-lg border ${RISK_STYLES[flag.level].border} ${RISK_STYLES[flag.level].bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_STYLES[flag.level].dot}`} />
                <span className="text-xs font-medium text-sigflo-text">{flag.label}</span>
              </div>
              <p className="text-xs text-sigflo-muted leading-relaxed pl-3.5">{flag.detail}</p>
              <p className="text-xs text-sigflo-accent mt-1.5 pl-3.5">{flag.action}</p>
            </div>
          ))}
        </div>
      )}

      {result && result.flags.length === 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <p className="text-xs text-sigflo-muted">No issues found. Your key follows recommended security practices.</p>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
