import crypto from 'node:crypto';
import { sanitizeHttpErrorDetail } from '../lib/httpErrorDetail.js';

export function signHmacSha256(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/** Hard cap on every outbound exchange HTTP call. Prevents hung Bybit/MEXC requests
 *  from blocking the portfolio route indefinitely. */
export const EXCHANGE_TIMEOUT_MS = 10_000;

export function exchangeSignal(): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), EXCHANGE_TIMEOUT_MS);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

/**
 * Parses JSON; on HTTP errors includes response body when present (Bybit often returns
 * `retCode` / `retMsg` even for 403 — plain `Request failed: 403` hides IP allowlist / key issues).
 */
export async function getJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const { signal, clear } = exchangeSignal();
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', headers, signal });
  } catch (e) {
    clear();
    if (e instanceof Error && e.name === 'AbortError') throw new Error(`Exchange request timed out (${url.slice(0, 60)})`);
    throw e;
  }
  clear();
  const text = await res.text();
  if (!res.ok) {
    let detail = text.trim().slice(0, 400);
    try {
      const j = JSON.parse(text) as { retMsg?: string; retCode?: number; message?: string };
      if (j.retMsg != null) {
        detail = `retCode=${j.retCode ?? '?'} ${j.retMsg}`;
      } else if (j.message != null) {
        detail = String(j.message);
      }
    } catch {
      /* not JSON */
    }
    detail = sanitizeHttpErrorDetail(detail, url);
    throw new Error(`Request failed: HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${url.slice(0, 80)}…`);
  }
}
