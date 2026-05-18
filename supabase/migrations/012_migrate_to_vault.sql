-- Enable the vault extension if not already enabled
create extension if not exists supabase_vault cascade;

-- Create a helper function to migrate existing broker accounts to the vault
-- This function will be called once during migration.
create or replace function migrate_broker_accounts_to_vault()
returns void as $$
declare
  account record;
  key_id uuid;
  secret_id uuid;
begin
  for account in select * from public.broker_accounts loop
    -- Insert API Key into Vault
    insert into vault.secrets (name, description, secret, key_id)
    values (
      'broker_account_api_key_' || account.id,
      'API Key for broker account ' || account.id,
      account.api_key_encrypted, -- Currently storing the encrypted blob as the secret
      (select id from vault.keys where name = 'default') -- Use default key for now
    ) returning id into key_id;

    -- Insert API Secret into Vault
    insert into vault.secrets (name, description, secret, key_id)
    values (
      'broker_account_api_secret_' || account.id,
      'API Secret for broker account ' || account.id,
      account.api_secret_encrypted,
      (select id from vault.keys where name = 'default')
    ) returning id into secret_id;

    -- Update broker_accounts to reference vault IDs (we'll need to add these columns first)
    -- For now, this is just a placeholder for the logic.
  end loop;
end;
$$ language plpgsql;

-- Add vault reference columns to broker_accounts
alter table public.broker_accounts add column if not exists api_key_vault_id uuid references vault.secrets(id);
alter table public.broker_accounts add column if not exists api_secret_vault_id uuid references vault.secrets(id);

-- Update the safe view to ensure it remains safe (it already excludes encrypted columns)
-- No changes needed to public.broker_account_safe_view as it explicitly selects columns.
