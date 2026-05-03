export type AlertChannel = 'in_app' | 'sound' | 'push';

export type AlertPreference = {
  enabled: boolean;
  minScore: number;
  states: ('Ready' | 'Triggered')[];
  channels: AlertChannel[];
};
