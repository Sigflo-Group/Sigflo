alter table public.profiles enable row level security;
alter table public.user_security_settings enable row level security;
alter table public.broker_accounts enable row level security;
alter table public.trade_intents enable row level security;
alter table public.trades enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_sessions enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- user_security_settings
drop policy if exists user_security_settings_select_own on public.user_security_settings;
create policy user_security_settings_select_own on public.user_security_settings for select using (user_id = auth.uid());

drop policy if exists user_security_settings_insert_own on public.user_security_settings;
create policy user_security_settings_insert_own on public.user_security_settings for insert with check (user_id = auth.uid());

drop policy if exists user_security_settings_update_own on public.user_security_settings;
create policy user_security_settings_update_own on public.user_security_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- broker_accounts
drop policy if exists broker_accounts_select_own on public.broker_accounts;
create policy broker_accounts_select_own on public.broker_accounts for select using (user_id = auth.uid());

drop policy if exists broker_accounts_insert_own on public.broker_accounts;
create policy broker_accounts_insert_own on public.broker_accounts for insert with check (user_id = auth.uid());

drop policy if exists broker_accounts_update_own on public.broker_accounts;
create policy broker_accounts_update_own on public.broker_accounts for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- trade_intents: client read-only; writes via service role / backend.
drop policy if exists trade_intents_select_own on public.trade_intents;
create policy trade_intents_select_own on public.trade_intents for select using (user_id = auth.uid());

-- trades: client read-only; writes via service role / backend.
drop policy if exists trades_select_own on public.trades;
create policy trades_select_own on public.trades for select using (user_id = auth.uid());

-- audit_logs: optional client read of own rows; inserts backend-only.
drop policy if exists audit_logs_select_own on public.audit_logs;
create policy audit_logs_select_own on public.audit_logs for select using (user_id = auth.uid());

-- user_sessions: client read + update (e.g. revoke); inserts preferred via backend.
drop policy if exists user_sessions_select_own on public.user_sessions;
create policy user_sessions_select_own on public.user_sessions for select using (user_id = auth.uid());

drop policy if exists user_sessions_update_own on public.user_sessions;
create policy user_sessions_update_own on public.user_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Explicit privileges (tighten sensitive tables for the authenticated role).
grant usage on schema public to authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.user_security_settings to authenticated;
grant select, insert, update on table public.broker_accounts to authenticated;

grant select on table public.trade_intents to authenticated;
grant select on table public.trades to authenticated;
grant select on table public.audit_logs to authenticated;

grant select, update on table public.user_sessions to authenticated;

grant select on table public.broker_account_safe_view to authenticated;

revoke insert, update, delete on table public.trade_intents from authenticated;
revoke insert, update, delete on table public.trades from authenticated;
revoke insert, update, delete on table public.audit_logs from authenticated;
revoke insert, delete on table public.user_sessions from authenticated;
