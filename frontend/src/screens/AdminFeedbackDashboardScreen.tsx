import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listFeedbackAdmin,
  listTopReporters,
  type FeedbackAdminRow,
  type FeedbackCategory,
  type FeedbackSeverity,
  type TopReporter,
} from '@/services/api/feedbackClient';

const CATEGORY_OPTIONS: Array<{ value: '' | FeedbackCategory; label: string }> = [
  { value: '', label: 'All categories' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'signal_quality', label: 'Signal quality' },
  { value: 'exchange_issue', label: 'Exchange issue' },
  { value: 'general', label: 'General' },
];

function severityPillClass(severity: FeedbackSeverity): string {
  if (severity === 'blocking') return 'border-rose-400/35 bg-rose-500/12 text-rose-200';
  if (severity === 'annoying') return 'border-amber-400/35 bg-amber-500/12 text-amber-200';
  if (severity === 'cosmetic') return 'border-cyan-400/35 bg-cyan-500/12 text-cyan-200';
  return 'border-white/15 bg-white/[0.04] text-sigflo-muted';
}

export default function AdminFeedbackDashboardScreen() {
  const [category, setCategory] = useState<'' | FeedbackCategory>('');
  const [rows, setRows] = useState<FeedbackAdminRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [reporters, setReporters] = useState<TopReporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      listFeedbackAdmin({ category }),
      listTopReporters(),
    ])
      .then(([feedbackResp, reportersResp]) => {
        if (cancelled) return;
        setRows(feedbackResp.feedback);
        setNextCursor(feedbackResp.nextCursor);
        setReporters(reportersResp.reporters);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load admin feedback.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const totals = useMemo(() => {
    const bySeverity: Record<FeedbackSeverity, number> = {
      normal: 0,
      cosmetic: 0,
      annoying: 0,
      blocking: 0,
    };
    for (const row of rows) bySeverity[row.severity] += 1;
    return {
      total: rows.length,
      blocking: bySeverity.blocking,
      annoying: bySeverity.annoying,
      cosmetic: bySeverity.cosmetic,
    };
  }, [rows]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const resp = await listFeedbackAdmin({ category, cursor: nextCursor });
      setRows((prev) => [...prev, ...resp.feedback]);
      setNextCursor(resp.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more feedback.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="pb-28 pt-4">
      <header className="mb-3 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Admin</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Feedback Dashboard</h2>
        <p className="mt-1 text-xs text-sigflo-muted">Review user submissions, severity, route context, and reporter activity.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Link
            to="/profile"
            className="inline-flex rounded-lg border border-white/[0.14] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]"
          >
            Back to Profile
          </Link>
          <label className="inline-flex items-center gap-2 text-[11px] text-sigflo-muted">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as '' | FeedbackCategory)}
              className="rounded-lg border border-white/[0.12] bg-black/30 px-2 py-1 text-[11px] text-white outline-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {loading ? (
        <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-sigflo-muted">Loading feedback…</p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3 py-2 text-sm text-rose-200">{error}</p>
      ) : null}

      {!loading ? (
        <>
          <section className="mb-3 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Overview</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard label="Rows loaded" value={`${totals.total}`} />
              <StatCard label="Blocking" value={`${totals.blocking}`} tone="bad" />
              <StatCard label="Annoying" value={`${totals.annoying}`} tone="warn" />
              <StatCard label="Cosmetic" value={`${totals.cosmetic}`} />
            </div>
          </section>

          <section className="mb-3 rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Top Reporters</h3>
            <div className="mt-2 space-y-1.5">
              {reporters.length === 0 ? (
                <p className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2 text-[11px] text-sigflo-muted">No reporter data yet.</p>
              ) : (
                reporters.map((r) => (
                  <div key={r.userId} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2">
                    <span className="min-w-0 truncate text-[11px] text-white/90">{r.email || r.userId}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-cyan-200">{r.count}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-sigflo-surface p-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Submissions</h3>
            <div className="mt-2 space-y-2">
              {rows.length === 0 ? (
                <p className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2 text-[11px] text-sigflo-muted">No feedback found for this filter.</p>
              ) : (
                rows.map((row) => (
                  <article key={row.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white">{row.category.replace('_', ' ')}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityPillClass(row.severity)}`}>
                        {row.severity}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[12px] text-white/90">{row.message}</p>
                    <p className="mt-1 text-[10px] text-sigflo-muted">
                      {new Date(row.createdAt).toLocaleString()} · route: {row.route ?? 'n/a'} · exchange: {row.activeExchange ?? 'n/a'} · app: {row.appVersion ?? 'n/a'}
                    </p>
                    {row.screenshotUrl ? (
                      <a
                        href={row.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        Open screenshot
                      </a>
                    ) : null}
                  </article>
                ))
              )}
            </div>
            {nextCursor ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="mt-2 rounded-lg border border-white/[0.14] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'bad' | 'warn';
}) {
  const toneClassName =
    tone === 'bad'
      ? 'text-rose-200 border-rose-500/20 bg-rose-500/[0.08]'
      : tone === 'warn'
        ? 'text-amber-200 border-amber-500/20 bg-amber-500/[0.08]'
        : 'text-white border-white/[0.08] bg-white/[0.03]';
  return (
    <article className={`rounded-xl border px-2.5 py-2 ${toneClassName}`}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </article>
  );
}

