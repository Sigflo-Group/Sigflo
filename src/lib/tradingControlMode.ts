import { secureStorage } from '@/lib/storage';
export type TradingControlMode = 'suggestion' | 'assisted' | 'auto';

export const TRADING_CONTROL_MODE_STORAGE_KEY = 'sigflo.tradingControlMode';

export const DEFAULT_TRADING_CONTROL_MODE: TradingControlMode = 'suggestion';

/** When true, exchange orders still require explicit user confirmation (future automation). */
export const TRADING_AUTO_EXECUTION_ACTIVE = false;

export function parseTradingControlMode(raw: string | null): TradingControlMode {
  if (raw === 'suggestion' || raw === 'assisted' || raw === 'auto') return raw;
  return DEFAULT_TRADING_CONTROL_MODE;
}

export function loadTradingControlMode(): TradingControlMode {
  if (typeof window === 'undefined') return DEFAULT_TRADING_CONTROL_MODE;
  return parseTradingControlMode(secureStorage.getItem(TRADING_CONTROL_MODE_STORAGE_KEY));
}

export type TradingControlModeMeta = {
  label: string;
  shortLabel: string;
  /** Bottom sheet primary line */
  sheetDescription: string;
  /** Bottom sheet secondary line */
  sheetSubtext: string;
  /** Shown on Bots trust card / hints */
  botsSummary: string;
  /** One line under mode name on Bots */
  botsDetail: string;
  /** Trade workspace hint */
  tradeHint: string;
  /** Bot focus cockpit strip */
  focusHint: string;
  /** Future: AI may adjust stops / scale without opening new risk */
  allowsPreparedExecution: boolean;
  /** Future: unattended exchange orders within limits */
  allowsAutomatedExecution: boolean;
};

export const TRADING_CONTROL_MODE_META: Record<TradingControlMode, TradingControlModeMeta> = {
  suggestion: {
    label: 'Suggestion',
    shortLabel: 'Suggestion',
    sheetDescription: 'AI analyzes. You execute.',
    sheetSubtext: 'No trades happen without your action.',
    botsSummary: 'AI analyzes markets and suggests setups — you execute every trade yourself.',
    botsDetail: 'Nothing is sent to the exchange without your explicit confirmation.',
    tradeHint: 'Suggestion — AI advises; you execute all orders manually.',
    focusHint: 'Suggestion — AI advises; you confirm every execution from this workspace.',
    allowsPreparedExecution: false,
    allowsAutomatedExecution: false,
  },
  assisted: {
    label: 'Assisted',
    shortLabel: 'Assisted',
    sheetDescription: 'AI prepares. You approve.',
    sheetSubtext: 'Faster execution with guided inputs.',
    botsSummary: 'AI prepares size, stops, and tickets — you approve before anything is sent.',
    botsDetail: 'Review prefilled risk and slide to confirm. Exit automation on Trade is separate when you enable it.',
    tradeHint: 'Assisted — review prepared trades and confirm execution.',
    focusHint: 'Assisted — tickets and risk are prepared for your approval before send.',
    allowsPreparedExecution: true,
    allowsAutomatedExecution: false,
  },
  auto: {
    label: 'Auto',
    shortLabel: 'Auto',
    sheetDescription: 'AI executes within your rules.',
    sheetSubtext: 'Requires defined risk limits.',
    botsSummary: 'Future: hands-off execution within your limits — not active yet.',
    botsDetail:
      'Automated orders need clear safeguards. Until then, Sigflo still requires your confirmation on every execution.',
    tradeHint: 'Auto (preview) — unattended trading is off; confirm orders as usual.',
    focusHint: 'Auto (preview) — no unattended orders yet; safeguards and limits will ship before live automation.',
    allowsPreparedExecution: true,
    allowsAutomatedExecution: TRADING_AUTO_EXECUTION_ACTIVE,
  },
};

export const TRADING_CONTROL_MODE_ORDER: TradingControlMode[] = ['suggestion', 'assisted', 'auto'];

/** Use when gating “prepared ticket” UX (e.g. assisted execution flows). */
export function tradingControlModeAllowsPreparedPlans(mode: TradingControlMode): boolean {
  return TRADING_CONTROL_MODE_META[mode].allowsPreparedExecution;
}

/** True only when unattended exchange execution is implemented and enabled. */
export function tradingControlModeAllowsAutomatedExecution(mode: TradingControlMode): boolean {
  return TRADING_AUTO_EXECUTION_ACTIVE && TRADING_CONTROL_MODE_META[mode].allowsAutomatedExecution;
}

export function tradingModeSwitchToast(mode: TradingControlMode): string {
  return `Switched to ${TRADING_CONTROL_MODE_META[mode].label} Mode`;
}
