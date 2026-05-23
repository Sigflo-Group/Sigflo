import { apiJson } from './http';

export type FeedbackCategory = 'bug' | 'feature' | 'signal_quality' | 'exchange_issue' | 'general';

export type FeedbackSeverityInput = 'cosmetic' | 'annoying' | 'blocking';
export type FeedbackSeverity = FeedbackSeverityInput | 'normal';

export type SignalReaction = 'helpful' | 'not_helpful';

export type SubmitFeedbackInput = {
  category: FeedbackCategory;
  severity?: FeedbackSeverityInput;
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
  severity: FeedbackSeverity;
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

// ─── Signal reactions ─────────────────────────────────────────────────────────

export async function submitSignalReaction(input: {
  signalId: string;
  pair: string;
  side: string;
  setupType: string;
  setupScore: number;
  riskTag: string | null;
  reaction: SignalReaction;
}): Promise<void> {
  await apiJson('/feedback/reactions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Top reporters (admin) ────────────────────────────────────────────────────

export type TopReporter = {
  userId: string;
  email: string;
  count: number;
};

export async function listTopReporters(): Promise<{ reporters: TopReporter[] }> {
  return apiJson('/feedback/top-reporters');
}
