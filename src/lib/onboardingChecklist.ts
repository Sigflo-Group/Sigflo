import { secureStorage } from '@/lib/storage';

const KEY = 'sigflo_onboarding_checklist';
const DISMISS_KEY = 'sigflo_onboarding_checklist_dismissed';

export interface ChecklistProgress {
  viewedFirstSignal: boolean;
  paperTraded: boolean;
  visitedMarkets: boolean;
  visitedRisk: boolean;
  connectedExchange: boolean;
}

const defaults: ChecklistProgress = {
  viewedFirstSignal: false,
  paperTraded: false,
  visitedMarkets: false,
  visitedRisk: false,
  connectedExchange: false,
};

export function readChecklist(): ChecklistProgress {
  try {
    const raw = secureStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function updateChecklist(partial: Partial<ChecklistProgress>): void {
  try {
    const current = readChecklist();
    const next = { ...current, ...partial };
    secureStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}

export function dismissChecklist(): void {
  try {
    secureStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Ignore.
  }
}

export function isChecklistDismissed(): boolean {
  try {
    return secureStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function isChecklistComplete(progress?: ChecklistProgress): boolean {
  const p = progress ?? readChecklist();
  const done = [p.viewedFirstSignal, p.paperTraded].filter(Boolean).length;
  const optionalDone = [p.visitedMarkets, p.visitedRisk, p.connectedExchange].filter(Boolean).length;
  return done >= 1 || done + optionalDone >= 3;
}
