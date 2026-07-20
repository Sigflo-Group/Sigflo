import { db } from '../index.js';

export type RiskMode = 'Defensive' | 'Balanced' | 'Aggressive';

export type UserRiskSettings = {
  riskMode: RiskMode;
  maxRiskPerTradePct: number;
  maxDailyLossPct: number;
  maxOpenPositions: number;
  allowLiveExecution: boolean;
  requireConfirmation: boolean;
  paperModeDefault: boolean;
};

export type UserRiskSettingsResult = UserRiskSettings & { persisted: boolean };

export const DEFAULT_USER_RISK_SETTINGS: UserRiskSettings = {
  riskMode: 'Balanced',
  maxRiskPerTradePct: 1,
  maxDailyLossPct: 3,
  maxOpenPositions: 3,
  allowLiveExecution: false,
  requireConfirmation: true,
  paperModeDefault: true,
};

type DbRow = {
  riskMode: RiskMode;
  maxRiskPerTradePct: string | number;
  maxDailyLossPct: string | number;
  maxOpenPositions: number;
  allowLiveExecution: boolean;
  requireConfirmation: boolean;
  paperModeDefault: boolean;
};

const SELECT_COLS = `
  risk_mode as "riskMode",
  max_risk_per_trade_pct as "maxRiskPerTradePct",
  max_daily_loss_pct as "maxDailyLossPct",
  max_open_positions as "maxOpenPositions",
  allow_live_execution as "allowLiveExecution",
  require_confirmation as "requireConfirmation",
  paper_mode_default as "paperModeDefault"
`;

function mapRow(row: DbRow): UserRiskSettings {
  return {
    riskMode: row.riskMode,
    maxRiskPerTradePct: Number(row.maxRiskPerTradePct),
    maxDailyLossPct: Number(row.maxDailyLossPct),
    maxOpenPositions: row.maxOpenPositions,
    allowLiveExecution: row.allowLiveExecution,
    requireConfirmation: row.requireConfirmation,
    paperModeDefault: row.paperModeDefault,
  };
}

export async function getUserRiskSettings(userId: string): Promise<UserRiskSettingsResult> {
  const { rows } = await db.query<DbRow>(
    `select ${SELECT_COLS} from user_risk_settings where user_id = $1::uuid limit 1`,
    [userId],
  );
  if (!rows[0]) return { ...DEFAULT_USER_RISK_SETTINGS, persisted: false };
  return { ...mapRow(rows[0]), persisted: true };
}

export async function upsertUserRiskSettings(userId: string, settings: UserRiskSettings): Promise<UserRiskSettingsResult> {
  const { rows } = await db.query<DbRow>(
    `insert into user_risk_settings
      (user_id, risk_mode, max_risk_per_trade_pct, max_daily_loss_pct, max_open_positions,
       allow_live_execution, require_confirmation, paper_mode_default)
     values ($1::uuid,$2,$3,$4,$5,$6,$7,$8)
     on conflict (user_id) do update set
       risk_mode = excluded.risk_mode,
       max_risk_per_trade_pct = excluded.max_risk_per_trade_pct,
       max_daily_loss_pct = excluded.max_daily_loss_pct,
       max_open_positions = excluded.max_open_positions,
       allow_live_execution = excluded.allow_live_execution,
       require_confirmation = excluded.require_confirmation,
       paper_mode_default = excluded.paper_mode_default,
       updated_at = now()
     returning ${SELECT_COLS}`,
    [
      userId,
      settings.riskMode,
      settings.maxRiskPerTradePct,
      settings.maxDailyLossPct,
      settings.maxOpenPositions,
      settings.allowLiveExecution,
      settings.requireConfirmation,
      settings.paperModeDefault,
    ],
  );
  return { ...mapRow(rows[0]!), persisted: true };
}
