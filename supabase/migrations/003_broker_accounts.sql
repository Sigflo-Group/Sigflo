create table if not exists public.broker_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  broker text not null,
  account_label text,
  api_key_encrypted text not null,
  api_secret_encrypted text not null,
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broker_accounts_user_broker_key unique (user_id, broker)
);

-- Safe for clients: no encrypted credential columns. Query runs as invoker so underlying RLS applies.
create or replace view public.broker_account_safe_view with (security_invoker = true) as
select
  id,
  user_id,
  broker,
  account_label,
  permissions,
  status,
  last_validated_at,
  created_at,
  updated_at
from
  public.broker_accounts;
