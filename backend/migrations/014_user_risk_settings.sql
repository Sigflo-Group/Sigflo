create table if not exists user_risk_settings (
  user_id text primary key references users(id) on delete cascade,
  risk_mode text not null default 'Balanced' check (risk_mode in ('Defensive', 'Balanced', 'Aggressive')),
  max_risk_per_trade_pct numeric(6,3) not null default 1 check (max_risk_per_trade_pct between 0.1 and 25),
  max_daily_loss_pct numeric(6,3) not null default 3 check (max_daily_loss_pct between 0.5 and 50),
  max_open_positions integer not null default 3 check (max_open_positions between 1 and 25),
  allow_live_execution boolean not null default false,
  require_confirmation boolean not null default true,
  paper_mode_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
