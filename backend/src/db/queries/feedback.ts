import { db } from '../index.js';

export type FeedbackRow = {
  id: string;
  userId: string;
  category: string;
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
  message: string;
  screenshotUrl?: string | null;
  route?: string | null;
  browserInfo: Record<string, unknown>;
  activeExchange?: string | null;
  appVersion?: string | null;
}): Promise<FeedbackRow> {
  const { rows } = await db.query<FeedbackRow>(
    `insert into feedback
      (user_id, category, message, screenshot_url, route, browser_info, active_exchange, app_version)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     returning
       id, user_id as "userId", category, message,
       screenshot_url as "screenshotUrl", route,
       browser_info as "browserInfo", active_exchange as "activeExchange",
       app_version as "appVersion", created_at as "createdAt"`,
    [
      input.userId,
      input.category,
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
