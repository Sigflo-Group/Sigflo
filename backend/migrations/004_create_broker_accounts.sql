create table if not exists broker_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  broker text not null,
  account_label text,
  api_key_encrypted text not null,
  api_secret_encrypted text not null,
  api_key_vault_id uuid,
  api_secret_vault_id uuid,
  permissions jsonb not null default '{}',
  status text not null check (status in ('connected', 'invalid')),
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, broker)
);

create index if not exists idx_broker_accounts_user_id on broker_accounts(user_id);