-- Reusable updated_at maintenance (before update).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row
execute function public.set_updated_at();

drop trigger if exists user_security_settings_set_updated_at on public.user_security_settings;
create trigger user_security_settings_set_updated_at before update on public.user_security_settings for each row
execute function public.set_updated_at();

drop trigger if exists broker_accounts_set_updated_at on public.broker_accounts;
create trigger broker_accounts_set_updated_at before update on public.broker_accounts for each row
execute function public.set_updated_at();

drop trigger if exists trades_set_updated_at on public.trades;
create trigger trades_set_updated_at before update on public.trades for each row
execute function public.set_updated_at();

drop trigger if exists user_sessions_set_updated_at on public.user_sessions;
create trigger user_sessions_set_updated_at before update on public.user_sessions for each row
execute function public.set_updated_at();

-- Auto-provision app rows when a Supabase auth user is created.
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
    values (new.id)
  on conflict (id) do nothing;

  insert into public.user_security_settings (user_id)
    values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_auth_user_created();
