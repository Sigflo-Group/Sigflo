import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import { postAdminBeta, type AdminBetaListResponse } from '@/lib/adminBetaApi';
import { listFeedbackAdmin, type FeedbackAdminRow, type FeedbackCategory } from '@/services/api/feedbackClient';

const ACCENT = '#00ffc8';

type ProfileRow = NonNullable<AdminBetaListResponse['profiles']>[number];
type AdminTab = 'beta' | 'feedback';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature: 'Feature',
  signal_quality: 'Signal quality',
  exchange_issue: 'Exchange',
  general: 'General',
};

const CATEGORY_COLOURS: Record<FeedbackCategory, string> = {
  bug: 'bg-rose-500/15 text-rose-300/90 border-rose-500/20',
  feature: 'bg-cyan-500/15 text-cyan-300/90 border-cyan-500/20',
  signal_quality: 'bg-violet-500/15 text-violet-300/90 border-violet-500/20',
  exchange_issue: 'bg-amber-500/15 text-amber-300/90 border-amber-500/20',
  general: 'bg-white/[0.07] text-white/65 border-white/10',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Feedback inbox ──────────────────────────────────────────────────────────

function FeedbackRow({ row }: { row: FeedbackAdminRow }) {
  const [expanded, setExpanded] = useState(false);
  const colour = CATEGORY_COLOURS[row.category] ?? CATEGORY_COLOURS.general;

  return (
    <div className="border-b border-white/[0.05] last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.025]"
      >
        <span className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colour}`}>
          {CATEGORY_LABELS[row.category] ?? row.category}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-white/90">{row.message}</p>
          <p className="mt-0.5 text-[11px] text-white/40">
            {row.userId.slice(0, 8)}…
            {row.route ? <span className="ml-2 font-mono">{row.route}</span> : null}
            {row.activeExchange ? <span className="ml-2">{row.activeExchange.toUpperCase()}</span> : null}
            <span className="ml-2">{timeAgo(row.createdAt)}</span>
          </p>
        </div>
        <span className="mt-1 shrink-0 text-[11px] text-white/30">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="bg-black/20 px-4 pb-4 pt-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">{row.message}</p>
          {row.screenshotUrl && (
            <a
              href={row.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block"
            >
              <img
                src={row.screenshotUrl}
                alt="Screenshot"
                className="max-h-64 rounded-lg border border-white/10 object-contain"
              />
            </a>
          )}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div><span className="text-white/35">User ID</span> <span className="font-mono text-white/65">{row.userId}</span></div>
            {row.route && <div><span className="text-white/35">Route</span> <span className="font-mono text-white/65">{row.route}</span></div>}
            {row.activeExchange && <div><span className="text-white/35">Exchange</span> <span className="text-white/65">{row.activeExchange}</span></div>}
            {row.appVersion && <div><span className="text-white/35">Version</span> <span className="text-white/65">{row.appVersion}</span></div>}
            <div><span className="text-white/35">Submitted</span> <span className="text-white/65">{new Date(row.createdAt).toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

type FilterCategory = FeedbackCategory | '';

function FeedbackInbox() {
  const [rows, setRows] = useState<FeedbackAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('');

  const load = useCallback(
    async (opts: { category: FilterCategory; cursor?: string; append?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listFeedbackAdmin({ category: opts.category, cursor: opts.cursor });
        setRows((prev) => (opts.append ? [...prev, ...res.feedback] : res.feedback));
        setNextCursor(res.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load feedback.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setCursor(undefined);
    void load({ category: filter });
  }, [filter, load]);

  const FILTERS: Array<{ value: FilterCategory; label: string }> = [
    { value: '', label: 'All' },
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'signal_quality', label: 'Signal quality' },
    { value: 'exchange_issue', label: 'Exchange' },
    { value: 'general', label: 'General' },
  ];

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 pb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
              filter === f.value
                ? 'border-[#00ffc8]/50 bg-[#00ffc8]/10 text-[#00ffc8]'
                : 'border-white/[0.1] bg-white/[0.04] text-white/55 hover:bg-white/[0.07]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load({ category: filter })}
          disabled={loading}
          className="ml-auto text-xs font-semibold text-[#00ffc8] hover:underline disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015]">
        {loading && rows.length === 0 ? (
          <p className="p-6 text-sm text-white/45">Loading…</p>
        ) : error ? (
          <div className="p-4 text-sm text-rose-300/90">
            {error}
            {error.includes('Admin') ? (
              <p className="mt-1 text-xs text-rose-200/60">
                Add your email to <span className="font-mono">SIGFLO_BETA_ADMIN_EMAILS</span> in the backend env and restart.
              </p>
            ) : null}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-white/45">No feedback yet{filter ? ` in "${CATEGORY_LABELS[filter as FeedbackCategory]}"` : ''}.</p>
        ) : (
          rows.map((row) => <FeedbackRow key={row.id} row={row} />)
        )}
      </div>

      {/* Load more */}
      {nextCursor && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const next = nextCursor;
            setCursor(next);
            void load({ category: filter, cursor: next, append: true });
          }}
          className="mt-3 w-full rounded-xl border border-white/[0.08] py-2 text-sm font-semibold text-white/55 transition hover:bg-white/[0.04] disabled:opacity-40"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function BetaAdminScreen() {
  const navigate = useNavigate();
  const { user, session, authMode, loading: authLoading } = useAuth();
  const token = session?.access_token ?? null;

  const [tab, setTab] = useState<AdminTab>('beta');
  const [list, setList] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await postAdminBeta(token, { action: 'list', limit: 120 });
      const j = (await res.json()) as AdminBetaListResponse & { code?: string };
      if (!res.ok) {
        setError(typeof j.error === 'string' ? j.error : `HTTP ${res.status ?? 'unknown'}`);
        setList([]);
        return;
      }
      setList(j.profiles ?? []);
    } catch {
      setError('Could not reach beta admin API.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const approveBy = useCallback(
    async (override?: { userId?: string; email?: string }) => {
      if (!token) return;
      const e = (override?.email ?? email).trim().toLowerCase();
      const id = (override?.userId ?? userId).trim();
      if (!e && !id) {
        setNotice('Enter an email or user id.');
        return;
      }
      setBusy(true);
      setNotice(null);
      try {
        const res = await postAdminBeta(token, {
          action: 'approve',
          ...(id ? { userId: id } : { email: e }),
        });
        const j = (await res.json()) as { ok?: boolean; error?: string; profile?: { email: string } };
        if (!res.ok) {
          setNotice(j.error ?? `Approve failed (${res.status})`);
          return;
        }
        setNotice(j.profile ? `Approved ${j.profile.email}` : 'Approved.');
        setEmail('');
        setUserId('');
        await load();
      } catch {
        setNotice('Network error while approving.');
      } finally {
        setBusy(false);
      }
    },
    [token, email, userId, load],
  );

  const onRevoke = useCallback(
    async (id: string) => {
      if (!token) return;
      setBusy(true);
      setNotice(null);
      try {
        const res = await postAdminBeta(token, { action: 'revoke', userId: id });
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setNotice(j.error ?? 'Revoke failed');
          return;
        }
        setNotice('Access revoked.');
        await load();
      } catch {
        setNotice('Network error while revoking.');
      } finally {
        setBusy(false);
      }
    },
    [token, load],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#050505] text-sm text-white/50">
        Loading…
      </div>
    );
  }

  if (authMode !== 'supabase' || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
              Team
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">Admin</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(getFeedRoute())}
              className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Back to app
            </button>
            <Link
              to="/profile"
              className="rounded-xl border border-white/[0.12] bg-transparent px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.05]"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {([['beta', 'Beta access'], ['feedback', 'Feedback inbox']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === id
                  ? 'bg-white/[0.09] text-white shadow-sm'
                  : 'text-white/45 hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Beta access tab ── */}
        {tab === 'beta' && (
          <>
            <div
              className="mb-6 rounded-2xl border border-white/[0.08] p-5 shadow-[0_0_60px_-24px_rgba(0,255,200,0.2)] backdrop-blur-xl"
              style={{
                background:
                  'linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.35) 100%)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Grant access</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-xs text-white/55">
                  Email (they must open the app once so a profile row exists)
                  <input
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="trader@example.com"
                    className="mt-1 w-full rounded-xl border border-white/[0.1] bg-black/35 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[rgba(0,255,200,0.35)]"
                    disabled={busy}
                  />
                </label>
                <label className="flex-1 text-xs text-white/55">
                  Or user id (UUID from Supabase Auth → Users)
                  <input
                    type="text"
                    value={userId}
                    onChange={(ev) => setUserId(ev.target.value)}
                    placeholder="00000000-0000-…"
                    className="mt-1 w-full rounded-xl border border-white/[0.1] bg-black/35 px-3 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-[rgba(0,255,200,0.35)]"
                    disabled={busy}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void approveBy()}
                  disabled={busy}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#0a0a0a] transition enabled:hover:brightness-110 disabled:opacity-45"
                  style={{ backgroundColor: ACCENT }}
                >
                  Approve
                </button>
              </div>
              {notice ? <p className="mt-3 text-sm text-amber-100/90">{notice}</p> : null}
              <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                Server env on Netlify: <span className="font-mono text-white/55">SUPABASE_SERVICE_ROLE_KEY</span>,{' '}
                <span className="font-mono text-white/55">SIGFLO_BETA_ADMIN_EMAILS</span> (your email). See{' '}
                <span className="font-mono">docs/NETLIFY.md</span>.
              </p>
            </div>

            {error ? (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-100/95">
                {error}
                {error.includes('Not a beta admin') ? (
                  <p className="mt-2 text-xs text-rose-100/75">
                    Add your account email to <span className="font-mono">SIGFLO_BETA_ADMIN_EMAILS</span> in Netlify, redeploy,
                    then try again.
                  </p>
                ) : null}
                {error.includes('SERVICE_ROLE') ? (
                  <p className="mt-2 text-xs text-rose-100/75">
                    Set <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> in Netlify (server only).
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Recent profiles</p>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading || !token}
                className="text-xs font-semibold text-[#00ffc8] hover:underline disabled:opacity-40"
              >
                Refresh
              </button>
            </div>

            <div className="mt-2 overflow-x-auto rounded-xl border border-white/[0.06]">
              {loading ? (
                <p className="p-6 text-sm text-white/45">Loading list…</p>
              ) : (
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.03] text-[11px] uppercase tracking-wide text-white/45">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Approved</th>
                      <th className="px-3 py-2 font-semibold">Created</th>
                      <th className="px-3 py-2 font-semibold"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-white/45">
                          No rows (or list failed). New users appear after their first sign-in.
                        </td>
                      </tr>
                    ) : (
                      list.map((row) => (
                        <tr key={row.id} className="border-b border-white/[0.04] last:border-0">
                          <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-xs text-white/85">{row.email}</td>
                          <td className="px-3 py-2.5">
                            {row.approved ? (
                              <span className="text-emerald-300/95">Yes</span>
                            ) : (
                              <span className="text-amber-200/90">Pending</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-white/50">
                            {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {row.approved ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void onRevoke(row.id)}
                                className="text-xs font-semibold text-rose-300/90 hover:underline disabled:opacity-40"
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void approveBy({ userId: row.id })}
                                className="text-xs font-semibold hover:underline disabled:opacity-40"
                                style={{ color: ACCENT }}
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── Feedback inbox tab ── */}
        {tab === 'feedback' && <FeedbackInbox />}

      </div>
    </div>
  );
}
