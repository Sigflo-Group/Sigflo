import { secureStorage } from '@/lib/storage';

const DISMISS_KEY = 'sigflo_first_trade_guide_dismissed';
const STEP_KEY = 'sigflo_first_trade_guide_step';

export function isFirstTradeGuideDismissed(): boolean {
  try {
    return secureStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissFirstTradeGuide(): void {
  try {
    secureStorage.setItem(DISMISS_KEY, '1');
    secureStorage.removeItem(STEP_KEY);
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}

export function readTradeGuideStep(): number {
  try {
    const raw = secureStorage.getItem(STEP_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveTradeGuideStep(step: number): void {
  try {
    secureStorage.setItem(STEP_KEY, String(step));
  } catch {
    // Ignore.
  }
}

export function clearTradeGuideSteps(): void {
  try {
    secureStorage.removeItem(STEP_KEY);
  } catch {
    // Ignore.
  }
}
