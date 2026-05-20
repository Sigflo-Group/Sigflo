import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFeedback } from '@/context/FeedbackContext';
import { submitFeedback, type FeedbackCategory } from '@/services/api/feedbackClient';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAccountSnapshot } from '@/hooks/useAccountSnapshot';

const CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature', label: 'Feature Request' },
  { id: 'signal_quality', label: 'Signal Quality' },
  { id: 'exchange_issue', label: 'Exchange Issue' },
  { id: 'general', label: 'General Feedback' },
];

function captureDeviceInfo(): Record<string, unknown> {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}

export function FeedbackModal() {
  const { isOpen, close } = useFeedback();
  const { pathname } = useLocation();
  const { items: snapshots } = useAccountSnapshot({ pollMs: 0 });

  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory('general');
      setMessage('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setError(null);
      setSubmitted(false);
      window.setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, busy, close]);

  if (!isOpen) return null;

  const activeExchange = snapshots.find((s) => s.status === 'connected')?.exchange ?? null;

  async function handleScreenshotChange(file: File | null) {
    if (!file) {
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadScreenshot(file: File, userId: string): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('feedback-screenshots')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return null;
    const { data } = supabase.storage.from('feedback-screenshots').getPublicUrl(path);
    return data.publicUrl ?? null;
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError('Please describe the issue or idea before submitting.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let screenshotUrl: string | null = null;
      if (screenshotFile && isSupabaseConfigured() && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          screenshotUrl = await uploadScreenshot(screenshotFile, user.id);
        }
      }

      await submitFeedback({
        category,
        message: message.trim(),
        screenshotUrl,
        route: pathname,
        browserInfo: captureDeviceInfo(),
        activeExchange: activeExchange ?? null,
        appVersion: import.meta.env.VITE_APP_VERSION ?? '0.0.1',
      });

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !busy && close()}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-white/[0.08] bg-sigflo-surface/95 backdrop-blur-2xl shadow-2xl">
        {submitted ? (
          <SuccessState onClose={close} />
        ) : (
          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Send Feedback</h2>
                <p className="mt-0.5 text-[12px] text-sigflo-muted">
                  A note to the Sigflo team — questions, ideas, or issues.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="shrink-0 rounded-lg p-1 text-sigflo-muted transition hover:bg-white/[0.06] hover:text-sigflo-text disabled:opacity-40"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Category pills */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                      category === id
                        ? 'border-sigflo-accent/60 bg-sigflo-accent/15 text-sigflo-accent'
                        : 'border-white/[0.10] bg-white/[0.04] text-sigflo-muted hover:border-white/[0.20] hover:text-sigflo-text'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message textarea */}
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">
                Message
              </label>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="Describe the issue, idea, or experience..."
                disabled={busy}
                className="w-full resize-none rounded-xl border border-white/[0.10] bg-sigflo-elevated px-3.5 py-3 text-[13px] text-sigflo-text placeholder:text-sigflo-muted/50 focus:border-sigflo-accent/40 focus:outline-none focus:ring-1 focus:ring-sigflo-accent/20 disabled:opacity-50"
              />
              <p className="mt-1 text-right text-[10px] text-sigflo-muted/60">
                {message.length}/4000
              </p>
            </div>

            {/* Screenshot upload */}
            <div className="mb-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">
                Screenshot <span className="font-normal normal-case tracking-normal text-sigflo-muted/60">(optional)</span>
              </p>
              {screenshotPreview ? (
                <div className="relative inline-block">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="h-24 w-auto max-w-full rounded-lg border border-white/[0.10] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/80 text-white ring-1 ring-black/20 hover:bg-rose-500"
                    aria-label="Remove screenshot"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-white/[0.14] bg-white/[0.02] px-4 py-3 text-[12px] text-sigflo-muted transition hover:border-white/[0.25] hover:bg-white/[0.04] hover:text-sigflo-text disabled:opacity-40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 16l4-4 4 4 4-6 4 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" strokeWidth={1.8} />
                  </svg>
                  Attach a screenshot
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleScreenshotChange(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Error */}
            {error ? (
              <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">{error}</p>
            ) : null}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-sigflo-muted/50">
                Page: {pathname} · {activeExchange ? activeExchange.toUpperCase() : 'No exchange'}
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy || !message.trim()}
                className="rounded-xl bg-sigflo-accent px-5 py-2 text-[13px] font-semibold text-sigflo-bg transition hover:bg-sigflo-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sigflo-accent/15 ring-1 ring-sigflo-accent/30">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="text-sigflo-accent" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-white">Thanks for the feedback</h3>
      <p className="mt-1 max-w-xs text-[13px] text-sigflo-muted">
        We read everything. It helps us make Sigflo better for you.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 rounded-xl border border-white/[0.10] bg-white/[0.04] px-6 py-2 text-[13px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]"
      >
        Close
      </button>
    </div>
  );
}
