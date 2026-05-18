import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APP_ANNOUNCEMENTS_PREF_EVENT,
  readAppAnnouncementsEnabled,
} from '@/lib/appAnnouncementsPreference';
import { subscribeGlobalAnnouncements, type GlobalAnnouncement } from '@/lib/globalAnnouncements';

const AUTO_DISMISS_MS = 5200;
const MAX_VISIBLE = 4;

function tryOsNotification(a: GlobalAnnouncement) {
  try {
    if (!readAppAnnouncementsEnabled()) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification(a.title, {
      body: a.subtitle ?? '',
      tag: a.id,
    });
  } catch (e) { console.error("[Caught Error]", e); }
}

function tryHaptic(kind: GlobalAnnouncement['kind']) {
  try {
    if (!readAppAnnouncementsEnabled()) return;
    if (kind === 'bias_flip') navigator.vibrate?.([12, 36, 12]);
    else navigator.vibrate?.([10, 28, 10]);
  } catch (e) { console.error("[Caught Error]", e); }
}

export function GlobalAnnouncementHost() {
  const [items, setItems] = useState<GlobalAnnouncement[]>([]);
  const [aiModalQueue, setAiModalQueue] = useState<GlobalAnnouncement[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t != null) {
      window.clearTimeout(t);
      timersRef.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    return subscribeGlobalAnnouncements((a) => {
      if (!readAppAnnouncementsEnabled()) return;
      tryOsNotification(a);
      tryHaptic(a.kind);
      if (a.kind === 'ai_action' && /exit/i.test(a.title)) {
        // Exit AI actions should be unmissable: use a blocking modal queue.
        setAiModalQueue((prev) => [...prev, a]);
        return;
      }
      setItems((prev) => [...prev, a].slice(-MAX_VISIBLE));
      const t = window.setTimeout(() => dismiss(a.id), AUTO_DISMISS_MS);
      timersRef.current.set(a.id, t);
    });
  }, [dismiss]);

  const dismissAiModal = useCallback(() => {
    setAiModalQueue((prev) => prev.slice(1));
  }, []);

  useEffect(() => {
    const clearWhenMuted = () => {
      if (readAppAnnouncementsEnabled()) return;
      for (const t of timersRef.current.values()) window.clearTimeout(t);
      timersRef.current.clear();
      setItems([]);
      setAiModalQueue([]);
    };
    window.addEventListener(APP_ANNOUNCEMENTS_PREF_EVENT, clearWhenMuted);
    window.addEventListener('storage', clearWhenMuted);
    return () => {
      window.removeEventListener(APP_ANNOUNCEMENTS_PREF_EVENT, clearWhenMuted);
      window.removeEventListener('storage', clearWhenMuted);
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const t of timersRef.current.values()) window.clearTimeout(t);
      timersRef.current.clear();
    };
  }, []);

  const activeAiModal = aiModalQueue[0] ?? null;
  if (items.length === 0 && !activeAiModal) return null;

  return (
    <>
      {items.length > 0 ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
          aria-live="polite"
        >
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => dismiss(a.id)}
              className={`pointer-events-auto w-full max-w-md rounded-xl border px-3.5 py-2.5 text-left shadow-[0_16px_48px_-12px_rgba(0,0,0,0.75)] backdrop-blur-md transition duration-200 ${
                a.kind === 'bias_flip'
                  ? 'border-cyan-400/40 bg-black/88 ring-1 ring-cyan-400/15'
                  : 'border-violet-400/35 bg-black/88 ring-1 ring-violet-400/12'
              }`}
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
                  a.kind === 'bias_flip' ? 'text-cyan-200/95' : 'text-violet-200/95'
                }`}
              >
                {a.title}
              </p>
              {a.subtitle ? (
                <p className="mt-0.5 text-sm font-semibold leading-snug text-white/95">{a.subtitle}</p>
              ) : null}
              <p className="mt-1 text-[9px] font-medium text-white/40">Tap to dismiss</p>
            </button>
          ))}
        </div>
      ) : null}

      {activeAiModal ? (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-live="assertive"
            className="w-full max-w-md rounded-2xl border border-violet-300/35 bg-[#08080c] p-4 shadow-[0_20px_70px_-18px_rgba(0,0,0,0.85)]"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200/95">{activeAiModal.title}</p>
            {activeAiModal.subtitle ? (
              <p className="mt-2 text-sm font-semibold leading-snug text-white/95">{activeAiModal.subtitle}</p>
            ) : null}
            <p className="mt-2 text-[10px] text-white/60">Exit AI decision popup — acknowledge to continue.</p>
            <button
              type="button"
              onClick={dismissAiModal}
              className="sigflo-pressable mt-3 w-full rounded-xl border border-violet-300/35 bg-violet-500/20 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100 shadow-[0_10px_26px_-12px_rgba(167,139,250,0.55)] transition hover:bg-violet-500/30"
            >
              Acknowledge
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
