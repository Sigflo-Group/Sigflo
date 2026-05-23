import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSecuritySummary } from '@/services/api/securityClient';
import type { SecuritySummary } from '@/types/security';
import type { IntegrationStatus } from '@/types/integrations';
import { useExchangeIntegrations } from '@/hooks/useExchangeIntegrations';
import { useAuth } from '@/context/AuthContext';
import { PermissionStatusCard } from './PermissionStatusCard';
import { KeyRotationFlow } from './KeyRotationFlow';
import { DeleteCredentialsFlow } from './DeleteCredentialsFlow';
import { SessionManager } from './SessionManager';
import { AuditLogViewer } from './AuditLogViewer';

type Panel = 'overview' | 'sessions' | 'audit_log' | 'rotate_key' | 'delete_credentials';

type Props = {
  onConnectExchange?: () => void;
};

export function SecurityCenter({ onConnectExchange }: Props) {
  const { user } = useAuth();
  const { items: exchanges, loading: exchangesLoading, refresh: refreshExchanges } = useExchangeIntegrations();
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>('overview');
  const [selectedAccount, setSelectedAccount] = useState<IntegrationStatus | null>(null);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await getSecuritySummary();
      setSummary(data);
    } catch {
      // non-critical — UI degrades gracefully
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadSummary();
  }, [user, loadSummary]);

  const openRotateKey = (account: IntegrationStatus) => {
    setSelectedAccount(account);
    setPanel('rotate_key');
  };

  const openDeleteCredentials = (account: IntegrationStatus) => {
    setSelectedAccount(account);
    setPanel('delete_credentials');
  };

  const handleRotateComplete = async () => {
    setPanel('overview');
    setSelectedAccount(null);
    await Promise.all([loadSummary(), refreshExchanges()]);
  };

  const handleDeleteComplete = async () => {
    setPanel('overview');
    setSelectedAccount(null);
    await refreshExchanges();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-sigflo-text">Security</h2>
          <p className="text-xs text-sigflo-muted mt-0.5">
            Manage credentials, sessions, and access controls.
          </p>
        </div>
        {panel !== 'overview' && (
          <button
            onClick={() => { setPanel('overview'); setSelectedAccount(null); }}
            className="flex items-center gap-1.5 text-xs text-sigflo-muted hover:text-sigflo-text transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={panel}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {panel === 'overview' && (
            <OverviewPanel
              exchanges={exchanges}
              exchangesLoading={exchangesLoading}
              summary={summary}
              summaryLoading={summaryLoading}
              onConnectExchange={onConnectExchange}
              onRotateKey={openRotateKey}
              onDeleteCredentials={openDeleteCredentials}
              onViewSessions={() => setPanel('sessions')}
              onViewAuditLog={() => setPanel('audit_log')}
            />
          )}

          {panel === 'sessions' && (
            <div className="space-y-4">
              <SessionManager />
            </div>
          )}

          {panel === 'audit_log' && (
            <div>
              <h3 className="text-sm font-medium text-sigflo-text mb-4">Security activity</h3>
              <AuditLogViewer
                entries={summary?.auditLog ?? []}
                loading={summaryLoading}
              />
            </div>
          )}

          {panel === 'rotate_key' && selectedAccount && (
            <KeyRotationFlow
              account={selectedAccount}
              onComplete={handleRotateComplete}
              onCancel={() => { setPanel('overview'); setSelectedAccount(null); }}
            />
          )}

          {panel === 'delete_credentials' && selectedAccount && (
            <DeleteCredentialsFlow
              account={selectedAccount}
              onComplete={handleDeleteComplete}
              onCancel={() => { setPanel('overview'); setSelectedAccount(null); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OverviewPanel({
  exchanges,
  exchangesLoading,
  summary,
  summaryLoading,
  onConnectExchange,
  onRotateKey,
  onDeleteCredentials,
  onViewSessions,
  onViewAuditLog,
}: {
  exchanges: IntegrationStatus[];
  exchangesLoading: boolean;
  summary: SecuritySummary | null;
  summaryLoading: boolean;
  onConnectExchange?: () => void;
  onRotateKey: (a: IntegrationStatus) => void;
  onDeleteCredentials: (a: IntegrationStatus) => void;
  onViewSessions: () => void;
  onViewAuditLog: () => void;
}) {
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  const recentEvents = summary?.auditLog.slice(0, 5) ?? [];
  const hasWithdrawalRisk = summary?.permissionSnapshots.some((p) => p.hasWithdrawalRisk);

  return (
    <div className="space-y-5">
      {hasWithdrawalRisk && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/25 bg-red-500/8">
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-400">Withdrawal risk detected</p>
            <p className="text-xs text-sigflo-muted mt-0.5 leading-relaxed">
              One or more of your API keys has withdrawal access enabled. Sigflo never needs this — regenerate your key with withdrawal permissions off.
            </p>
          </div>
        </div>
      )}

      <Section title="Connected exchanges">
        {exchangesLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-sigflo-surface border border-white/6 animate-pulse" />
            ))}
          </div>
        ) : exchanges.length === 0 ? (
          <EmptyExchanges onConnect={onConnectExchange} />
        ) : (
          <div className="space-y-3">
            {exchanges.map((account) => (
              <ExchangeAccountCard
                key={account.id}
                account={account}
                expanded={expandedAccount === account.id}
                onToggle={() =>
                  setExpandedAccount((prev) => (prev === account.id ? null : account.id))
                }
                onRotateKey={() => onRotateKey(account)}
                onDelete={() => onDeleteCredentials(account)}
                permissionSnapshot={summary?.permissionSnapshots.find(
                  (p) => p.exchange === account.exchange,
                )}
              />
            ))}
            {onConnectExchange && (
              <button
                onClick={onConnectExchange}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-xs text-sigflo-muted hover:text-sigflo-text hover:border-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add exchange
              </button>
            )}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <NavCard
          icon="🕐"
          title="Sessions"
          description="View and revoke active sessions"
          onClick={onViewSessions}
        />
        <NavCard
          icon="📋"
          title="Activity log"
          description="Security events and access history"
          badge={recentEvents.length > 0 ? String(recentEvents.length) : undefined}
          onClick={onViewAuditLog}
          loading={summaryLoading}
        />
      </div>

      {summary?.keyRotations && summary.keyRotations.length > 0 && (
        <Section title="Recent key rotations">
          <div className="space-y-1.5">
            {summary.keyRotations.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/5 bg-sigflo-surface">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">🔑</span>
                  <div>
                    <div className="text-xs font-medium text-sigflo-text capitalize">{r.exchange}</div>
                    {r.reason && <div className="text-xs text-sigflo-muted">{r.reason}</div>}
                  </div>
                </div>
                <span className="text-xs text-sigflo-muted">{formatDate(r.rotatedAt)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function ExchangeAccountCard({
  account,
  expanded,
  onToggle,
  onRotateKey,
  onDelete,
  permissionSnapshot,
}: {
  account: IntegrationStatus;
  expanded: boolean;
  onToggle: () => void;
  onRotateKey: () => void;
  onDelete: () => void;
  permissionSnapshot?: { hasWithdrawalRisk: boolean; readOnly: boolean } | undefined;
}) {
  const isConnected = account.status === 'connected';
  const hasRisk = permissionSnapshot?.hasWithdrawalRisk ?? false;

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${
      hasRisk ? 'border-red-500/20' : isConnected ? 'border-white/8' : 'border-sigflo-loss/20'
    } bg-sigflo-surface`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            hasRisk ? 'bg-red-400' : isConnected ? 'bg-emerald-400' : 'bg-sigflo-loss'
          }`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-sigflo-text capitalize">{account.exchange}</span>
              {account.accountLabel && (
                <span className="text-xs text-sigflo-muted">{account.accountLabel}</span>
              )}
              {account.isActive && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-sigflo-accent/10 text-sigflo-accent font-medium">
                  Active
                </span>
              )}
              {hasRisk && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                  Review needed
                </span>
              )}
            </div>
            <div className="text-xs text-sigflo-muted mt-0.5">
              {isConnected ? (
                <>Connected{account.lastValidatedAt ? ` · Verified ${formatDate(account.lastValidatedAt)}` : ''}</>
              ) : (
                'Invalid credentials — reconnect required'
              )}
            </div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-sigflo-muted flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/5">
              <PermissionStatusCard
                account={account}
                onAuditComplete={() => {}}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onRotateKey}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-white/8 bg-sigflo-elevated text-sigflo-muted hover:text-sigflo-text hover:border-white/16 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                    <path d="M1 7a6 6 0 0112 0M12 4v3h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Rotate key
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-sigflo-loss/15 text-sigflo-loss/60 hover:text-sigflo-loss hover:border-sigflo-loss/30 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                    <path d="M2 4h10M5 4V2h4v2M12 4l-.7 8H2.7L2 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Disconnect
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyExchanges({ onConnect }: { onConnect?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-sigflo-surface p-8 text-center">
      <div className="w-10 h-10 rounded-xl bg-sigflo-elevated flex items-center justify-center mx-auto mb-3">
        <svg className="w-5 h-5 text-sigflo-muted" fill="none" viewBox="0 0 20 20">
          <path d="M10 3a7 7 0 100 14A7 7 0 0010 3zm1 4H9v4h2V7zm0 5H9v2h2v-2z" fill="currentColor" />
        </svg>
      </div>
      <p className="text-sm font-medium text-sigflo-text">No exchange connected</p>
      <p className="text-xs text-sigflo-muted mt-1 mb-4 leading-relaxed">
        Connect an exchange to start reading your positions and portfolio.
      </p>
      {onConnect && (
        <button
          onClick={onConnect}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-sigflo-accent text-black hover:bg-sigflo-accent/90 transition-all"
        >
          Connect exchange
        </button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-sigflo-muted uppercase tracking-wider px-0.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function NavCard({
  icon,
  title,
  description,
  badge,
  onClick,
  loading,
}: {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-4 rounded-xl border border-white/6 bg-sigflo-surface text-left hover:border-white/12 hover:bg-white/[0.02] transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        {badge && !loading && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-sigflo-elevated text-sigflo-muted font-medium">
            {badge}
          </span>
        )}
        {loading && (
          <div className="w-8 h-3 rounded bg-sigflo-elevated animate-pulse" />
        )}
      </div>
      <div>
        <div className="text-xs font-medium text-sigflo-text">{title}</div>
        <div className="text-xs text-sigflo-muted mt-0.5 leading-relaxed">{description}</div>
      </div>
    </button>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const hours = diff / 3600000;
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return 'yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
