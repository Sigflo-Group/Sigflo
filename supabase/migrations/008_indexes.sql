-- profiles.id is already indexed by the primary key; no extra btree needed.

create index if not exists idx_broker_accounts_user_id on public.broker_accounts (user_id);
create index if not exists idx_broker_accounts_user_created_desc on public.broker_accounts (user_id, created_at desc);

create index if not exists idx_trade_intents_user_id on public.trade_intents (user_id);
create index if not exists idx_trade_intents_broker_account_id on public.trade_intents (broker_account_id);
create index if not exists idx_trade_intents_expires_at on public.trade_intents (expires_at);
create index if not exists idx_trade_intents_user_execution_token_hash on public.trade_intents (user_id, execution_token_hash);

create index if not exists idx_trades_user_id on public.trades (user_id);
create index if not exists idx_trades_broker_account_id on public.trades (broker_account_id);
create index if not exists idx_trades_trade_intent_id on public.trades (trade_intent_id);

create index if not exists idx_audit_logs_user_id on public.audit_logs (user_id);

create index if not exists idx_user_sessions_user_id on public.user_sessions (user_id);

create index if not exists idx_trade_intents_user_created_desc on public.trade_intents (user_id, created_at desc);

create index if not exists idx_trades_user_created_desc on public.trades (user_id, created_at desc);
