import { apiJson } from './http';

export type FeedbackCategory = 'bug' | 'feature' | 'signal_quality' | 'exchange_issue' | 'general';

export type SubmitFeedbackInput = {
  category: FeedbackCategory;
  message: string;
  screenshotUrl?: string | null;
  route?: string | null;
  browserInfo?: Record<string, unknown>;
  activeExchange?: string | null;
  appVersion?: string | null;
};

export async function submitFeedback(input: SubmitFeedbackInput): Promise<{ id: string; createdAt: string }> {
  return apiJson('/feedback', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export type FeedbackAdminRow = {
  id: string;
  userId: string;
  category: FeedbackCategory;
  message: string;
  screenshotUrl: string | null;
  route: string | null;
  activeExchange: string | null;
  appVersion: string | null;
  createdAt: string;
};

export async function listFeedbackAdmin(opts: {
  category?: FeedbackCategory | '';
  cursor?: string;
} = {}): Promise<{ feedback: FeedbackAdminRow[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (opts.category) params.set('category', opts.category);
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiJson(`/feedback${qs ? `?${qs}` : ''}`);
}
