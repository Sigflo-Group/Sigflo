import { db } from '../index.js';

export type FeedbackRow = {
  id: string;
  userId: string;
  category: string;
  severity: string;
  message: string;
  screenshotUrl: string | null;
  route: string | null;
  browserInfo: Record<string, unknown>;
  activeExchange: string | null;
  appVersion: string | null;
  createdAt: string;
};

export async function insertFeedback(input: {
  userId: string;
  category: string;
  severity?: string;
  message: string;
  screenshotUrl?: string | null;
  route?: string | null;
  browserInfo: Record<string, unknown>;
  activeExchange?: string | null;
  appVersion?: string | null;
}): Promise<FeedbackRow> {
  const { rows } = await db.query<FeedbackRow>(
    `insert into feedback
      (user_id, category, severity, message, screenshot_url, route, browser_info, active_exchange, app_version)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
     returning
       id, user_id as "userId", category, severity, message,
       screenshot_url as "screenshotUrl", route,
       browser_info as "browserInfo", active_exchange as "activeExchange",
       app_version as "appVersion", created_at as "createdAt"`,
    [
      input.userId,
      input.category,
      input.severity ?? 'normal',
      input.message,
      input.screenshotUrl ?? null,
      input.route ?? null,
      JSON.stringify(input.browserInfo ?? {}),
      input.activeExchange ?? null,
      input.appVersion ?? null,
    ],
  );
  return rows[0]!;
}

export async function countFeedbackByUser(): Promise<Array<{ userId: string; email: string; count: number }>> {
  const { rows } = await db.query<{ userId: string; email: string; count: number }>(
    `select
       f.user_id as "userId",
       coalesce(p.email, 'unknown') as email,
       count(*)::int as count
     from feedback f
     left join public.profiles p on p.id::text = f.user_id
     group by f.user_id, p.email
     order by count(*) desc
     limit 20`,
  );
  return rows;
}

/**
 * Admin-only: list feedback submissions, newest first.
 * Supports cursor-based pagination (cursor = createdAt of last seen row) and
 * optional category filter.
 */
export async function listFeedback(opts: {
  limit?: number;
  cursor?: string;
  category?: string;
}): Promise<FeedbackRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.category) {
    params.push(opts.category);
    conditions.push(`category = $${params.length}`);
  }
  if (opts.cursor) {
    params.push(opts.cursor);
    conditions.push(`created_at < $${params.length}`);
  }

  params.push(opts.limit ?? 50);
  const limitParam = `$${params.length}`;

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query<FeedbackRow>(
    `SELECT
       id,
       user_id       AS "userId",
       category,
       severity,
       message,
       screenshot_url  AS "screenshotUrl",
       route,
       browser_info    AS "browserInfo",
       active_exchange AS "activeExchange",
       app_version     AS "appVersion",
       created_at      AS "createdAt"
     FROM feedback
     ${where}
     ORDER BY created_at DESC
     LIMIT ${limitParam}`,
    params,
  );
  return rows;
}
