create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  broker_account_id uuid not null references public.broker_accounts (id) on delete cascade,
  trade_intent_id uuid references public.trade_intents (id) on delete set null,
  broker_order_id text,
  symbol text not null,
  direction text not null,
  position_size_usd numeric not null,
  leverage numeric not null,
  entry_price numeric,
  stop_price numeric,
  target_price numeric,
  status text not null default 'pending',
  broker_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
