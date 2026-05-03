export type PaperTradeInput = {
  balance: number;
  riskPercent: number;
  entryPrice: number;
  stopPrice: number;
  targets: number[];
  direction: 'LONG' | 'SHORT';
};

export type PaperTradeResult = {
  positionSize: number;
  riskAmount: number;
  lossAtStop: number;
  profitTargets: {
    price: number;
    pnl: number;
    rr: number;
  }[];
};
