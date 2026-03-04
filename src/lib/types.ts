
export type TransactionType = 'income' | 'expense';

export interface Partner {
  id: string;
  email: string;
  name: string;
  sharePercentage: number;
}

export interface Agency {
  id: string;
  name: string;
  partners: Partner[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  currency: 'USD' | 'BDT';
  amount: number;
  amountUSD: number;
  date: string;
  description: string;
  category?: string;
  project?: string;
  handledBy: string; // partnerId
}

export interface Settlement {
  id: string;
  fromPartnerId: string;
  toPartnerId: string;
  currency: 'USD' | 'BDT';
  amount: number;
  amountUSD: number;
  date: string;
  note?: string;
}

export interface SettlementSuggestion {
  from: string; // partnerId
  to: string; // partnerId
  amount: number;
}

export interface PartnerBalance {
  partnerId: string;
  name: string;
  shouldReceive: number;
  handledNet: number;
  balance: number; // Positive = holds extra (pays out), Negative = owed
}
