-- Add is_active flag to broker_accounts so users can have multiple exchanges
-- connected simultaneously and switch the "active" one without re-entering credentials.

alter table broker_accounts
  add column if not exists is_active boolean not null default false;

-- At most one active account per user at any time.
create unique index if not exists broker_accounts_one_active_per_user
  on broker_accounts (user_id)
  where is_active = true;
