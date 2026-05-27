import { useState, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { apiJson } from '@/services/api/http';

type Session = {
  id: string;
  createdAt: string;
  revokedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export function SessionManager() {
  const { securityState, refreshSecurityState } = useSession();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessions: Session[] = securityState?.sessions ?? [];
  const activeSessions = sessions.filter((s) => !s.revokedAt);

  const revokeSession = useCallback(
    async (sessionId: string) => {
      setRevokingId(sessionId);
      setError(null);
      try {
        await apiJson('/session/revoke', {
          method: 'POST',
          body: JSON.stringify({ sessionId }),
        });
        await refreshSecurityState();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to revoke session.');
      } finally {
        setRevokingId(null);
      }
    },
    [refreshSecurityState],
  );

  if (!securityState) {
    return (
      <div className="rounded-xl border border-white/6 bg-sigflo-surface p-5">
        <p className="text-sm text-sigflo-muted">Loading session data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-sigflo-text">Active sessions</h3>
        <p className="text-xs text-sigflo-muted mt-0.5">
          {activeSessions.length} active{' '}
          {activeSessions.length === 1 ? 'session' : 'sessions'}. Revoke any you don't recognise.
        </p>
      </div>

      {error && (
        <p className="text-xs text-sigflo-loss">{error}</p>
      )}

      {activeSessions.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-sigflo-surface p-5 text-center">
          <p className="text-sm text-sigflo-muted">No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeSessions.map((session, i) => {
            const isCurrentHeuristic = i === 0;
            const parsedUa = parseUserAgent(session.userAgent);
            const isRevoking = revokingId === session.id;

            return (
              <div
                key={session.id}
                className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-white/6 bg-sigflo-surface"
              >
                <div className="flex gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sigflo-elevated flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{parsedUa.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-sigflo-text truncate">
                        {parsedUa.label}
                      </span>
                      {isCurrentHeuristic && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-sigflo-accent/15 text-sigflo-accent font-medium flex-shrink-0">
                          This session
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-sigflo-muted mt-0.5 space-y-0.5">
                      {session.ipAddress && <div>{session.ipAddress}</div>}
                      <div>Started {formatRelativeTime(session.createdAt)}</div>
                    </div>
                  </div>
                </div>
                {!isCurrentHeuristic && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={isRevoking}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs text-sigflo-loss/70 border border-sigflo-loss/15 hover:border-sigflo-loss/30 hover:text-sigflo-loss transition-all disabled:opacity-50"
                  >
                    {isRevoking ? '...' : 'Revoke'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function parseUserAgent(ua: string | null): { label: string; icon: string } {
  if (!ua) return { label: 'Unknown device', icon: '🖥️' };
  const lower = ua.toLowerCase();
  if (lower.includes('iphone') || lower.includes('ipad')) return { label: 'iOS device', icon: '📱' };
  if (lower.includes('android')) return { label: 'Android device', icon: '📱' };
  if (lower.includes('mac')) return { label: 'Mac', icon: '💻' };
  if (lower.includes('windows')) return { label: 'Windows', icon: '🖥️' };
  if (lower.includes('linux')) return { label: 'Linux', icon: '🖥️' };
  return { label: 'Browser session', icon: '🌐' };
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
