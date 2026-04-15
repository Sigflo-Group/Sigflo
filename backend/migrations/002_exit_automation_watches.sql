-- Server-side Exit AI watches: poll Bybit + rule engine while the SPA is closed.
-- Apply after 001_init.sql.

create table if not exists exit_automation_watches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  exchange text not null default 'bybit' check (exchange in ('bybit', 'mexc')),
  market text not null default 'linear' check (market in ('linear', 'spot')),
  enabled boolean not null default true,
  symbol text not null,
  side text not null check (side in ('long', 'short')),
  position_idx int not null default 0,
  stop_price double precision not null,
  target_price double precision not null,
  trend_alignment double precision not null,
  momentum_quality double precision not null,
  strategy_preset text not null check (strategy_preset in ('protect_profit', 'trend_follow', 'tight_risk', 'custom')),
  custom_thresholds jsonb,
  safeguards jsonb not null,
  last_guidance_state text not null check (last_guidance_state in ('hold', 'trim', 'exit')),
  last_error text,
  last_checked_at timestamptz,
  last_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One watch row per open leg; toggle `enabled` instead of inserting duplicates.
create unique index if not exists exit_automation_watches_leg_unique
  on exit_automation_watches (user_id, exchange, symbol, side, position_idx);

create index if not exists exit_automation_watches_enabled_idx
  on exit_automation_watches (enabled)
  where enabled = true;
