import { db } from '../db/index.js';
import {
  coerceAutomationSafeguards,
  sanitizeExitStrategyThresholds,
  type AutomationSafeguards,
  type ExitStrategyPreset,
  type ExitStrategyThresholds,
} from '../lib/exitGuidanceEngine.js';

export type ExitAutomationWatchRow = {
  id: string;
  user_id: string;
  exchange: string;
  market: string;
  enabled: boolean;
  symbol: string;
  side: 'long' | 'short';
  position_idx: number;
  stop_price: number;
  target_price: number;
  trend_alignment: number;
  momentum_quality: number;
  strategy_preset: ExitStrategyPreset;
  custom_thresholds: Partial<ExitStrategyThresholds> | null;
  safeguards: AutomationSafeguards;
  last_guidance_state: 'hold' | 'trim' | 'exit';
  last_error: string | null;
  last_checked_at: Date | null;
  last_action_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UpsertExitWatchInput = {
  exchange?: string;
  market?: string;
  enabled: boolean;
  symbol: string;
  side: 'long' | 'short';
  positionIdx: number;
  stopPrice: number;
  targetPrice: number;
  trendAlignment: number;
  momentumQuality: number;
  strategyPreset: ExitStrategyPreset;
  customThresholds: Partial<ExitStrategyThresholds> | null;
  safeguards: AutomationSafeguards;
  lastGuidanceState: 'hold' | 'trim' | 'exit';
};

function rowFromDb(r: Record<string, unknown>): ExitAutomationWatchRow {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    exchange: String(r.exchange),
    market: String(r.market),
    enabled: Boolean(r.enabled),
    symbol: String(r.symbol).toUpperCase(),
    side: r.side === 'short' ? 'short' : 'long',
    position_idx: Number(r.position_idx) || 0,
    stop_price: Number(r.stop_price),
    target_price: Number(r.target_price),
    trend_alignment: Number(r.trend_alignment),
    momentum_quality: Number(r.momentum_quality),
    strategy_preset: r.strategy_preset as ExitStrategyPreset,
    custom_thresholds:
      r.custom_thresholds == null
        ? null
        : sanitizeExitStrategyThresholds(r.custom_thresholds as Partial<ExitStrategyThresholds>),
    safeguards: coerceAutomationSafeguards(r.safeguards),
    last_guidance_state: r.last_guidance_state as 'hold' | 'trim' | 'exit',
    last_error: r.last_error == null ? null : String(r.last_error),
    last_checked_at: r.last_checked_at instanceof Date ? r.last_checked_at : r.last_checked_at ? new Date(String(r.last_checked_at)) : null,
    last_action_at:
      r.last_action_at instanceof Date ? r.last_action_at : r.last_action_at ? new Date(String(r.last_action_at)) : null,
    created_at: r.created_at instanceof Date ? r.created_at : new Date(String(r.created_at)),
    updated_at: r.updated_at instanceof Date ? r.updated_at : new Date(String(r.updated_at)),
  };
}

export async function listEnabledExitWatches(): Promise<ExitAutomationWatchRow[]> {
  const res = await db.query(
    `select * from exit_automation_watches where enabled = true order by created_at asc`,
  );
  return res.rows.map((x) => rowFromDb(x as Record<string, unknown>));
}

export async function listExitWatchesForUser(userId: string): Promise<ExitAutomationWatchRow[]> {
  const res = await db.query(`select * from exit_automation_watches where user_id = $1 order by updated_at desc`, [
    userId,
  ]);
  return res.rows.map((x) => rowFromDb(x as Record<string, unknown>));
}

export async function upsertExitWatch(userId: string, input: UpsertExitWatchInput): Promise<ExitAutomationWatchRow> {
  const exchange = (input.exchange ?? 'bybit').toLowerCase();
  const market = (input.market ?? 'linear').toLowerCase();
  const sym = input.symbol.trim().toUpperCase();

  const res = await db.query(
    `insert into exit_automation_watches (
      user_id, exchange, market, enabled, symbol, side, position_idx,
      stop_price, target_price, trend_alignment, momentum_quality,
      strategy_preset, custom_thresholds, safeguards, last_guidance_state,
      last_error, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,null,now())
    on conflict (user_id, exchange, symbol, side, position_idx) do update set
      market = excluded.market,
      enabled = excluded.enabled,
      stop_price = excluded.stop_price,
      target_price = excluded.target_price,
      trend_alignment = excluded.trend_alignment,
      momentum_quality = excluded.momentum_quality,
      strategy_preset = excluded.strategy_preset,
      custom_thresholds = excluded.custom_thresholds,
      safeguards = excluded.safeguards,
      last_guidance_state = excluded.last_guidance_state,
      last_error = null,
      updated_at = now()
    returning *`,
    [
      userId,
      exchange,
      market,
      input.enabled,
      sym,
      input.side,
      input.positionIdx,
      input.stopPrice,
      input.targetPrice,
      input.trendAlignment,
      input.momentumQuality,
      input.strategyPreset,
      input.customThresholds ?? null,
      input.safeguards,
      input.lastGuidanceState,
    ],
  );
  const row = res.rows[0];
  if (!row) throw new Error('upsertExitWatch: no row returned');
  return rowFromDb(row as Record<string, unknown>);
}

export async function updateExitWatchRuntime(
  id: string,
  patch: {
    lastGuidanceState?: 'hold' | 'trim' | 'exit';
    lastError?: string | null;
    lastCheckedAt?: Date;
    lastActionAt?: Date | null;
  },
): Promise<void> {
  const sets: string[] = ['updated_at = now()'];
  const vals: unknown[] = [];
  let i = 1;

  if (patch.lastGuidanceState != null) {
    sets.push(`last_guidance_state = $${i++}`);
    vals.push(patch.lastGuidanceState);
  }
  if (patch.lastError !== undefined) {
    sets.push(`last_error = $${i++}`);
    vals.push(patch.lastError);
  }
  if (patch.lastCheckedAt != null) {
    sets.push(`last_checked_at = $${i++}`);
    vals.push(patch.lastCheckedAt);
  }
  if (patch.lastActionAt !== undefined) {
    sets.push(`last_action_at = $${i++}`);
    vals.push(patch.lastActionAt);
  }

  vals.push(id);
  await db.query(`update exit_automation_watches set ${sets.join(', ')} where id = $${i}`, vals);
}

export async function disableExitWatch(userId: string, watchId: string): Promise<boolean> {
  const res = await db.query(
    `update exit_automation_watches set enabled = false, updated_at = now() where id = $1 and user_id = $2`,
    [watchId, userId],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function deleteExitWatchByLeg(
  userId: string,
  args: { exchange: string; symbol: string; side: 'long' | 'short'; positionIdx: number },
): Promise<boolean> {
  const res = await db.query(
    `delete from exit_automation_watches where user_id = $1 and exchange = $2 and symbol = $3 and side = $4 and position_idx = $5`,
    [userId, args.exchange.toLowerCase(), args.symbol.trim().toUpperCase(), args.side, args.positionIdx],
  );
  return (res.rowCount ?? 0) > 0;
}

/** Worker: position gone — turn off watch so we do not spin on stale rows. */
export async function disableExitWatchSystem(watchId: string, reason: string): Promise<void> {
  await db.query(
    `update exit_automation_watches set enabled = false, last_error = $2, last_checked_at = now(), updated_at = now() where id = $1`,
    [watchId, reason.slice(0, 2000)],
  );
}
