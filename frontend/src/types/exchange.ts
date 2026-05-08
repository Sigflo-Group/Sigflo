export type BrokerLinkStatus = {
  id: string;
  broker: string;
  linked: boolean;
  status: 'pending' | 'connected' | 'invalid' | 'disconnected';
  accountLabel: string | null;
  permissions: Record<string, unknown>;
  lastValidatedAt: string | null;
};

export type LinkExchangeRequest = {
  broker: 'bybit';
  apiKey: string;
  apiSecret: string;
  accountLabel?: string;
};

export type LinkExchangeResponse = {
  ok: true;
  account: BrokerLinkStatus;
};

export type RevalidateExchangeResponse = {
  ok: true;
  account: BrokerLinkStatus;
};
