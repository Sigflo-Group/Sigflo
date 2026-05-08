/**
 * Maps Bybit `retMsg` (and our backend `Bybit error: …` wrappers) to short, actionable toast copy.
 * Unknown messages pass through unchanged.
 */
export type BybitErrorCta = {
  label: string;
  href: string;
};

export type FormattedBybitTradeError = {
  message: string;
  cta?: BybitErrorCta;
};

const BYBIT_METALS_TERMS_HREF = 'https://www.bybit.com/trade/usdt/XAGUSDT';

function normalizeBybitErrorString(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const s = raw.trim();
  if (!s) return '';
  return s
    .replace(/^Bybit error:\s*/i, '')
    .replace(/^Bybit HTTP \d+:\s*/i, '')
    .replace(/^Request failed: HTTP \d+ —\s*/i, '')
    .trim();
}

function requiresTermsAcceptance(msg: string): boolean {
  const low = msg.toLowerCase();
  const hasAgreeTerms =
    low.includes('must agree') ||
    (low.includes('agree') && (low.includes('terms') || low.includes('conditions')));
  return hasAgreeTerms;
}

export function resolveBybitTradeError(err: unknown, fallback = 'Request failed'): FormattedBybitTradeError {
  const stripped = normalizeBybitErrorString(err);
  if (!stripped) return { message: fallback };
  const low = stripped.toLowerCase();

  if (requiresTermsAcceptance(stripped)) {
    return {
      message: 'Bybit requires product terms acceptance before this trade. Open Bybit, accept terms, then tap retry.',
      cta: {
        label: 'Open Bybit terms',
        href: BYBIT_METALS_TERMS_HREF,
      },
    };
  }

  if (
    low.includes('ab not enough') ||
    low.includes('not enough for new order') ||
    low.includes('available balance not enough') ||
    (low.includes('insufficient') && low.includes('margin'))
  ) {
    return {
      message:
        'Not enough available margin on Bybit for this order. Try a smaller size or lower leverage, or free margin (other positions/orders lock collateral). Available is what remains for new orders.',
    };
  }

  if (low.includes('insufficient balance')) {
    return {
      message:
        'Insufficient balance on Bybit for this order. Check unified trading available funds, not only total equity.',
    };
  }

  if (low.includes('qty') && (low.includes('invalid') || low.includes('too large') || low.includes('too small'))) {
    return { message: 'Order size did not meet Bybit rules (min, max, or step). Adjust size and try again.' };
  }

  if (low.includes('position idx') || low.includes('positionidx') || low.includes('position mode')) {
    return {
      message: 'Bybit rejected this for your position mode (one-way vs hedge). Check hedge settings on the exchange.',
    };
  }

  if (low.includes('read only') || low.includes('readonly') || low.includes('permission denied')) {
    return { message: 'This API key cannot trade on Bybit. Connect a read/write key in Account.' };
  }

  if (low.includes('not modified')) {
    return {
      message:
        'Bybit reports nothing to change (already set). If you just placed an order, check the exchange — it may have gone through.',
    };
  }

  if (low.includes('leverage') && low.includes('invalid')) {
    return {
      message: 'Bybit could not apply that leverage for this symbol. Lower leverage or set it on the exchange, then retry.',
    };
  }

  if (low.includes('reduce only') && low.includes('reject')) {
    return { message: 'Bybit rejected a reduce-only constraint. Confirm you are closing/reducing the correct side.' };
  }

  if (low.includes('tp') && low.includes('sl') && (low.includes('invalid') || low.includes('reject'))) {
    return {
      message: 'Take-profit or stop-loss did not pass Bybit checks (price side vs position). Adjust levels and try again.',
    };
  }

  if (low.includes('rate limit') || low.includes('too many requests')) {
    return { message: 'Bybit rate limit — wait a few seconds and try again.' };
  }

  return { message: stripped };
}

export function formatBybitTradeErrorMessage(err: unknown, fallback = 'Request failed'): string {
  return resolveBybitTradeError(err, fallback).message;
}
