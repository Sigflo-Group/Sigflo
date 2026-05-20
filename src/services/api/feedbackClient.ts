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
