-- Add vault reference columns to exchange_integrations
alter table exchange_integrations add column if not exists api_key_vault_id uuid;
alter table exchange_integrations add column if not exists api_secret_vault_id uuid;
alter table exchange_integrations add column if not exists api_passphrase_vault_id uuid;

-- Note: The actual vault extension and table reside in the 'vault' schema,
-- which is managed by Supabase. This migration only adds the reference columns
-- to our local 'exchange_integrations' table.
