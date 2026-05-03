create table if not exists public.trade_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  broker_account_id uuid not null references public.broker_accounts (id) on delete cascade,
  symbol text not null,
  direction text not null,
  entry_price numeric,
  stop_price numeric,
  target_price numeric,
  position_size_usd numeric not null,
  leverage numeric not null,
  risk_summary jsonb not null default '{}'::jsonb,
  execution_token_hash text not null,
  idempotency_key text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
