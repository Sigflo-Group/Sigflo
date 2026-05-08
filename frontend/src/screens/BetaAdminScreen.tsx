import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import { postAdminBeta, type AdminBetaListResponse } from '@/lib/adminBetaApi';

const ACCENT = '#00ffc8';

type ProfileRow = NonNullable<AdminBetaListResponse['profiles']>[number];

export default function BetaAdminScreen() {
  const navigate = useNavigate();
  const { user, session, authMode, loading: authLoading } = useAuth();
  const token = session?.access_token ?? null;

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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
              Team
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">Beta access</h1>
            <p className="mt-1 text-sm text-white/55">Approve or revoke `public.profiles` (same source as the waitlist gate).</p>
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
      </div>
    </div>
  );
}
