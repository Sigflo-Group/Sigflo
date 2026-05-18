export type GlobalAnnouncementKind = 'bias_flip' | 'ai_action';

export type GlobalAnnouncement = {
  id: string;
  kind: GlobalAnnouncementKind;
  title: string;
  subtitle?: string;
  createdAt: number;
};

type Listener = (a: GlobalAnnouncement) => void;

const listeners = new Set<Listener>();

export function emitGlobalAnnouncement(
  partial: Omit<GlobalAnnouncement, 'createdAt'> & { createdAt?: number },
): void {
  const announcement: GlobalAnnouncement = {
    ...partial,
    createdAt: partial.createdAt ?? Date.now(),
  };
  for (const fn of listeners) {
    try {
      fn(announcement);
    } catch (e) { console.error("[Caught Error]", e); }
  }
}

export function subscribeGlobalAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
