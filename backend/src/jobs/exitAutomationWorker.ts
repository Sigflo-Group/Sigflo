import { BybitAdapter } from '../exchanges/bybit.js';
import { listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import {
  disableExitWatchSystem,
  listEnabledExitWatches,
  updateExitWatchRuntime,
  type ExitAutomationWatchRow,
} from '../repositories/exitWatchRepo.js';
import { decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { log } from '../lib/logger.js';
import { retryTransientNetwork } from '../lib/transientNetworkRetry.js';
import { linearQtyFromBaseAmount } from '../lib/linearOrderQty.js';
import { resolveExitWatchGuidance, type ExitStrategyPreset } from '../lib/exitGuidanceEngine.js';

const bybit = new BybitAdapter();

function workerEnabled(): boolean {
  const v = process.env.EXIT_AUTOMATION_WORKER_ENABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function workerIntervalMs(): number {
  const n = Number(process.env.EXIT_AUTOMATION_WORKER_INTERVAL_MS ?? '45000');
  return Number.isFinite(n) && n >= 5000 ? n : 45000;
}

function matchPosition(watch: ExitAutomationWatchRow, positions: Awaited<ReturnType<BybitAdapter['fetchPositions']>>) {
  const sym = watch.symbol.toUpperCase();
  const idx = watch.position_idx;
  return positions.find(
    (p) =>
      p.symbol.toUpperCase() === sym &&
      p.side === watch.side &&
      (p.positionIdx ?? 0) === idx &&
      p.size > 0,
  );
}

export async function runExitAutomationTick(): Promise<void> {
  const watches = await retryTransientNetwork(() => listEnabledExitWatches(), {
    retries: 4,
    baseDelayMs: 500,
  });
  if (watches.length === 0) return;

  for (const w of watches) {
    try {
      await processOneWatch(w);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log('warn', 'Exit watch processing error.', { watchId: w.id, userId: w.user_id, error: msg });
      await updateExitWatchRuntime(w.id, {
        lastCheckedAt: new Date(),
        lastError: msg.slice(0, 2000),
      });
    }
  }
}

async function processOneWatch(w: ExitAutomationWatchRow): Promise<void> {
  if (w.exchange !== 'bybit' || w.market !== 'linear') {
    await disableExitWatchSystem(w.id, 'Only Bybit linear is supported for server exit automation.');
    return;
  }

  const accounts = await listBrokerAccountsForUser(w.user_id);
  const account = accounts.find((a) => a.broker === 'bybit' && a.status === 'connected');
  if (!account) {
    await updateExitWatchRuntime(w.id, {
      lastCheckedAt: new Date(),
      lastError: 'Bybit not connected for this account.',
    });
    return;
  }

  const creds = {
    apiKey: decryptBrokerCredential(account.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(account.apiSecretEncrypted),
  };

  let positions: Awaited<ReturnType<BybitAdapter['fetchPositions']>>;
  try {
    positions = await bybit.fetchPositions(creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateExitWatchRuntime(w.id, { lastCheckedAt: new Date(), lastError: msg.slice(0, 2000) });
    return;
  }

  const pos = matchPosition(w, positions);
  if (!pos) {
    await updateExitWatchRuntime(w.id, {
      lastCheckedAt: new Date(),
      lastError: 'Open position not found on Bybit — will retry next tick.',
    });
    return;
  }

  const entry = pos.entryPrice;
  const mark =
    pos.markPrice != null && Number.isFinite(pos.markPrice) && pos.markPrice > 0 ? pos.markPrice : entry;
  if (!(entry > 0) || !(mark > 0)) {
    await updateExitWatchRuntime(w.id, {
      lastCheckedAt: new Date(),
      lastError: 'Invalid entry or mark from exchange.',
    });
    return;
  }

  const preset = w.strategy_preset as ExitStrategyPreset;
  const customPartial =
    preset === 'custom' ? (w.custom_thresholds as Record<string, number> | null) ?? null : null;

  const resolved = resolveExitWatchGuidance({
    side: w.side,
    entry,
    mark,
    stop: w.stop_price,
    target: w.target_price,
    trendAlignment: w.trend_alignment,
    momentumQuality: w.momentum_quality,
    strategyPreset: preset,
    customStrategyThresholds: customPartial,
    safeguards: w.safeguards,
  });

  const prev = w.last_guidance_state;
  const curr = resolved.effective.state;
  const safeguards = w.safeguards;

  const trimEdge = curr === 'trim' && prev === 'hold' && safeguards.allowPartialExits;
  const exitEdge =
    curr === 'exit' && safeguards.allowFullAutoClose && (prev === 'hold' || prev === 'trim');

  const now = new Date();

  // Persist the new guidance state BEFORE attempting any order so that a
  // subsequent DB failure cannot leave the edge gate open for re-firing.
  // If this update fails we bail early — safer to miss a tick than to risk
  // a duplicate order on the next tick.
  await updateExitWatchRuntime(w.id, {
    lastGuidanceState: curr,
    lastCheckedAt: now,
    lastError: null,
  });

  if (!trimEdge && !exitEdge) return;

  try {
    await bybit.ensureTradeEnabled(creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateExitWatchRuntime(w.id, { lastCheckedAt: now, lastError: msg.slice(0, 2000) });
    return;
  }

  const closeSide = pos.side === 'long' ? 'Sell' : 'Buy';
  const fraction = trimEdge ? 0.5 : 1;
  const qtyBase = Math.abs(pos.size) * Math.min(1, Math.max(0, fraction));
  const qtyStr = linearQtyFromBaseAmount(qtyBase);

  try {
    await bybit.placeLinearOrder(creds, {
      symbol: pos.symbol,
      side: closeSide,
      orderType: 'Market',
      qty: qtyStr,
      reduceOnly: true,
      positionIdx: pos.positionIdx ?? 0,
    });
    log('info', 'Exit automation order submitted.', {
      watchId: w.id,
      userId: w.user_id,
      symbol: pos.symbol,
      kind: trimEdge ? 'trim' : 'close',
      qty: qtyStr,
    });
    await updateExitWatchRuntime(w.id, { lastActionAt: now });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log('warn', 'Exit automation order failed.', { watchId: w.id, error: msg });
    await updateExitWatchRuntime(w.id, {
      lastCheckedAt: now,
      lastError: msg.slice(0, 2000),
    });
  }
}

export function startExitAutomationWorker(): void {
  if (!workerEnabled()) return;

  const intervalMs = workerIntervalMs();
  log('info', 'Exit automation worker enabled.', { intervalMs });

  let ticking = false;
  const tick = async () => {
    if (ticking) return;
    ticking = true;
    try {
      await runExitAutomationTick();
    } catch (e) {
      log('error', 'Exit automation tick failed.', { error: String(e) });
    } finally {
      ticking = false;
    }
  };

  void tick();
  const handle = setInterval(() => void tick(), intervalMs);
  process.once('SIGTERM', () => clearInterval(handle));
  process.once('SIGINT', () => clearInterval(handle));
}
