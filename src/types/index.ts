export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  date: string;
  note: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  adjustmentTargetBalance?: number;
  adjustmentDiff?: number;
  recurringId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  sort: number;
}

export type AccountType = 'cash' | 'bank' | 'wechat' | 'alipay' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  balance: number;
  sort: number;
}

export interface Budget {
  id: string;
  categoryId: string | null;
  amount: number;
  month: string;
}

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Recurring {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: Frequency;
  startDate: string;
  nextDate: string;
  note: string;
  active: boolean;
}

export interface Settings {
  privacyLockEnabled: boolean;
  privacyPassword: string;
  currency: string;
  firstDayOfWeek: number;
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  recurring: Recurring[];
  settings: Settings;
}
