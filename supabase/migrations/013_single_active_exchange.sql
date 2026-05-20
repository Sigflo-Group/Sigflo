-- Enforce single active exchange per user at the database level.
-- The existing unique(user_id, broker) constraint already prevents
-- multiple accounts for the same broker. This migration makes the
-- "single active" concept explicit with an is_active column.

alter table public.broker_accounts
  add column if not exists is_active boolean not null default true;

-- Ensure only one exchange is active per user at any time.
create unique index if not exists broker_accounts_user_active_key
  on public.broker_accounts (user_id)
  where is_active = true;

comment on column public.broker_accounts.is_active is
  'True for the single exchange this user is currently trading through. Only one row per user may have is_active = true.';
