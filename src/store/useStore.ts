import { create } from 'zustand';
import type {
  Transaction,
  Category,
  Account,
  Budget,
  Recurring,
  Settings,
  AppData,
  TransactionType,
} from '@/types';
import { loadFromStorage, saveToStorage } from '@/utils/storage';
import { todayStr, currentMonthStr, getNextDate } from '@/utils/date';

const generateId = (): string => Math.random().toString(36).slice(2, 11);

export const TRANSFER_CATEGORY_ID = 'cat-system-transfer';
export const ADJUSTMENT_CATEGORY_ID = 'cat-system-adjustment';

const defaultCategories: Category[] = [
  { id: 'cat-food', name: '餐饮', type: 'expense', icon: 'UtensilsCrossed', color: '#F97316', sort: 0 },
  { id: 'cat-transport', name: '交通', type: 'expense', icon: 'Car', color: '#3B82F6', sort: 1 },
  { id: 'cat-shopping', name: '购物', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', sort: 2 },
  { id: 'cat-entertainment', name: '娱乐', type: 'expense', icon: 'Gamepad2', color: '#8B5CF6', sort: 3 },
  { id: 'cat-housing', name: '居住', type: 'expense', icon: 'Home', color: '#14B8A6', sort: 4 },
  { id: 'cat-medical', name: '医疗', type: 'expense', icon: 'Heart', color: '#EF4444', sort: 5 },
  { id: 'cat-education', name: '教育', type: 'expense', icon: 'GraduationCap', color: '#6366F1', sort: 6 },
  { id: 'cat-other-exp', name: '其他', type: 'expense', icon: 'MoreHorizontal', color: '#6B7280', sort: 7 },
  { id: 'cat-salary', name: '工资', type: 'income', icon: 'Briefcase', color: '#10B981', sort: 0 },
  { id: 'cat-bonus', name: '奖金', type: 'income', icon: 'Gift', color: '#22C55E', sort: 1 },
  { id: 'cat-invest', name: '投资', type: 'income', icon: 'TrendingUp', color: '#06B6D4', sort: 2 },
  { id: 'cat-parttime', name: '兼职', type: 'income', icon: 'Clock', color: '#F59E0B', sort: 3 },
  { id: 'cat-redpacket', name: '红包', type: 'income', icon: 'Coins', color: '#EF4444', sort: 4 },
  { id: 'cat-other-inc', name: '其他', type: 'income', icon: 'MoreHorizontal', color: '#6B7280', sort: 5 },
  { id: TRANSFER_CATEGORY_ID, name: '账户转账', type: 'transfer', icon: 'ArrowRightLeft', color: '#6366F1', sort: 998 },
  { id: ADJUSTMENT_CATEGORY_ID, name: '余额校准', type: 'adjustment', icon: 'Scale', color: '#8B5CF6', sort: 999 },
];

const defaultAccounts: Account[] = [
  { id: 'acc-cash', name: '现金', type: 'cash', icon: 'Wallet', color: '#10B981', balance: 0, sort: 0 },
  { id: 'acc-bank', name: '银行卡', type: 'bank', icon: 'Landmark', color: '#3B82F6', balance: 0, sort: 1 },
  { id: 'acc-alipay', name: '支付宝', type: 'alipay', icon: 'Smartphone', color: '#06B6D4', balance: 0, sort: 2 },
  { id: 'acc-wechat', name: '微信钱包', type: 'wechat', icon: 'MessageCircle', color: '#22C55E', balance: 0, sort: 3 },
];

const defaultSettings: Settings = {
  privacyLockEnabled: false,
  privacyPassword: '',
  currency: '¥',
  firstDayOfWeek: 1,
};

interface StoreState extends AppData {
  isUnlocked: boolean;
  initialize: () => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  addCategory: (c: Omit<Category, 'id' | 'sort'>) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addAccount: (a: Omit<Account, 'id' | 'sort' | 'balance'> & { balance?: number }) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromAccountId: string, toAccountId: string, amount: number, date: string, note?: string) => void;
  adjustAccountBalance: (accountId: string, newBalance: number, note?: string) => void;
  setBudget: (month: string, categoryId: string | null, amount: number) => void;
  deleteBudget: (id: string) => void;
  addRecurring: (r: Omit<Recurring, 'id' | 'nextDate'>) => void;
  updateRecurring: (id: string, r: Partial<Recurring>) => void;
  deleteRecurring: (id: string) => void;
  skipRecurringNext: (id: string) => void;
  recordRecurringNow: (id: string) => void;
  processRecurring: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  setPassword: (password: string) => void;
  unlock: (password: string) => boolean;
  lock: () => void;
  importAll: (data: AppData) => void;
  resetAll: () => void;
  recalculateBalances: () => void;
}

const getInitialState = (): AppData => {
  const saved = loadFromStorage();
  if (saved) {
    const existingCatIds = new Set(saved.categories.map((c) => c.id));
    const missingSystemCats = defaultCategories.filter((c) => !existingCatIds.has(c.id));
    return {
      ...saved,
      categories: [...saved.categories, ...missingSystemCats],
    };
  }
  return {
    transactions: [],
    categories: defaultCategories,
    accounts: defaultAccounts,
    budgets: [],
    recurring: [],
    settings: defaultSettings,
  };
};

const getInitialIsUnlocked = (): boolean => {
  const saved = loadFromStorage();
  if (saved && saved.settings.privacyLockEnabled) {
    return false;
  }
  return true;
};

export const useStore = create<StoreState>((set, get) => ({
  ...getInitialState(),
  isUnlocked: getInitialIsUnlocked(),

  initialize: () => {
    get().processRecurring();
  },

  addTransaction: (t) => {
    const newT: Transaction = {
      ...t,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const transactions = [newT, ...state.transactions];
      const newState = { ...state, transactions };
      saveToStorage(newState);
      return newState;
    });
    get().recalculateBalances();
  },

  updateTransaction: (id, t) => {
    set((state) => {
      const transactions = state.transactions.map((item) =>
        item.id === id ? { ...item, ...t, updatedAt: new Date().toISOString() } : item
      );
      const newState = { ...state, transactions };
      saveToStorage(newState);
      return newState;
    });
    get().recalculateBalances();
  },

  deleteTransaction: (id) => {
    set((state) => {
      const transactions = state.transactions.filter((item) => item.id !== id);
      const newState = { ...state, transactions };
      saveToStorage(newState);
      return newState;
    });
    get().recalculateBalances();
  },

  deleteTransactions: (ids) => {
    set((state) => {
      const transactions = state.transactions.filter((item) => !ids.includes(item.id));
      const newState = { ...state, transactions };
      saveToStorage(newState);
      return newState;
    });
    get().recalculateBalances();
  },

  addCategory: (c) => {
    set((state) => {
      const maxSort = state.categories
        .filter((cat) => cat.type === c.type)
        .reduce((max, cat) => Math.max(max, cat.sort), -1);
      const newCat: Category = { ...c, id: generateId(), sort: maxSort + 1 };
      const categories = [...state.categories, newCat];
      const newState = { ...state, categories };
      saveToStorage(newState);
      return newState;
    });
  },

  updateCategory: (id, c) => {
    set((state) => {
      const target = state.categories.find((cat) => cat.id === id);
      let transactions = state.transactions;
      if (target && c.type && target.type !== c.type) {
        transactions = state.transactions.map((t) =>
          t.categoryId === id ? { ...t, type: c.type as TransactionType } : t
        );
      }
      const categories = state.categories.map((item) =>
        item.id === id ? { ...item, ...c } : item
      );
      const newState = { ...state, categories, transactions };
      saveToStorage(newState);
      return newState;
    });
    get().recalculateBalances();
  },

  deleteCategory: (id) => {
    if (id === TRANSFER_CATEGORY_ID || id === ADJUSTMENT_CATEGORY_ID) return;
    set((state) => {
      const categories = state.categories.filter((item) => item.id !== id);
      const newState = { ...state, categories };
      saveToStorage(newState);
      return newState;
    });
  },

  addAccount: (a) => {
    set((state) => {
      const maxSort = state.accounts.reduce((max, acc) => Math.max(max, acc.sort), -1);
      const newAcc: Account = { ...a, id: generateId(), sort: maxSort + 1, balance: a.balance ?? 0 };
      const accounts = [...state.accounts, newAcc];
      const newState = { ...state, accounts };
      saveToStorage(newState);
      return newState;
    });
  },

  updateAccount: (id, a) => {
    set((state) => {
      const accounts = state.accounts.map((item) =>
        item.id === id ? { ...item, ...a } : item
      );
      const newState = { ...state, accounts };
      saveToStorage(newState);
      return newState;
    });
  },

  deleteAccount: (id) => {
    set((state) => {
      const accounts = state.accounts.filter((item) => item.id !== id);
      const newState = { ...state, accounts };
      saveToStorage(newState);
      return newState;
    });
  },

  transferBetweenAccounts: (fromAccountId, toAccountId, amount, date, note = '') => {
    if (fromAccountId === toAccountId || amount <= 0) return;
    const newT: Transaction = {
      id: generateId(),
      type: 'transfer',
      amount,
      categoryId: TRANSFER_CATEGORY_ID,
      accountId: fromAccountId,
      toAccountId,
      date,
      note: note || '账户转账',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const transactions = [newT, ...state.transactions];
      const newState = { ...state, transactions };
      saveToStorage(newState);
      return newState;
    });
    get().recalculateBalances();
  },

  adjustAccountBalance: (accountId, newBalance, note = '') => {
    const state = get();
    const account = state.accounts.find((a) => a.id === accountId);
    if (!account) return;

    const diff = newBalance - account.balance;
    if (diff === 0) return;

    const newT: Transaction = {
      id: generateId(),
      type: 'adjustment',
      amount: Math.abs(diff),
      categoryId: ADJUSTMENT_CATEGORY_ID,
      accountId,
      date: todayStr(),
      note: note || `余额校准：${account.balance.toFixed(2)} → ${newBalance.toFixed(2)} (${diff >= 0 ? '+' : ''}${diff.toFixed(2)})`,
      adjustmentTargetBalance: newBalance,
      adjustmentDiff: diff,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => {
      const transactions = [newT, ...s.transactions];
      const accounts = s.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: newBalance } : a
      );
      const newState = { ...s, transactions, accounts };
      saveToStorage(newState);
      return newState;
    });
  },

  setBudget: (month, categoryId, amount) => {
    set((state) => {
      const existing = state.budgets.find(
        (b) => b.month === month && b.categoryId === categoryId
      );
      let budgets: Budget[];
      if (existing) {
        budgets = state.budgets.map((b) =>
          b.id === existing.id ? { ...b, amount } : b
        );
      } else {
        const newBudget: Budget = {
          id: generateId(),
          categoryId,
          amount,
          month,
        };
        budgets = [...state.budgets, newBudget];
      }
      const newState = { ...state, budgets };
      saveToStorage(newState);
      return newState;
    });
  },

  deleteBudget: (id) => {
    set((state) => {
      const budgets = state.budgets.filter((b) => b.id !== id);
      const newState = { ...state, budgets };
      saveToStorage(newState);
      return newState;
    });
  },

  addRecurring: (r) => {
    set((state) => {
      const newR: Recurring = {
        ...r,
        id: generateId(),
        nextDate: getNextDate(r.startDate, r.frequency),
      };
      const recurring = [...state.recurring, newR];
      const newState = { ...state, recurring };
      saveToStorage(newState);
      return newState;
    });
  },

  updateRecurring: (id, r) => {
    set((state) => {
      const recurring = state.recurring.map((item) =>
        item.id === id ? { ...item, ...r } : item
      );
      const newState = { ...state, recurring };
      saveToStorage(newState);
      return newState;
    });
  },

  deleteRecurring: (id) => {
    set((state) => {
      const recurring = state.recurring.filter((item) => item.id !== id);
      const newState = { ...state, recurring };
      saveToStorage(newState);
      return newState;
    });
  },

  skipRecurringNext: (id) => {
    const r = get().recurring.find((x) => x.id === id);
    if (!r) return;
    get().updateRecurring(id, { nextDate: getNextDate(r.nextDate, r.frequency) });
  },

  recordRecurringNow: (id) => {
    const r = get().recurring.find((x) => x.id === id);
    if (!r) return;
    get().addTransaction({
      type: r.type,
      amount: r.amount,
      categoryId: r.categoryId,
      accountId: r.accountId,
      date: r.nextDate,
      note: r.note,
      recurringId: r.id,
    });
    get().updateRecurring(id, { nextDate: getNextDate(r.nextDate, r.frequency) });
  },

  processRecurring: () => {
    const state = get();
    const today = todayStr();
    const dueRecurring = state.recurring.filter(
      (r) => r.active && r.nextDate <= today && (r.type === 'income' || r.type === 'expense')
    );
    dueRecurring.forEach((r) => {
      const alreadyExists = get().transactions.some(
        (t) => t.recurringId === r.id && t.date === r.nextDate
      );
      if (alreadyExists) {
        get().updateRecurring(r.id, { nextDate: getNextDate(r.nextDate, r.frequency) });
        return;
      }
      get().addTransaction({
        type: r.type,
        amount: r.amount,
        categoryId: r.categoryId,
        accountId: r.accountId,
        date: r.nextDate,
        note: r.note,
        recurringId: r.id,
      });
      get().updateRecurring(r.id, {
        nextDate: getNextDate(r.nextDate, r.frequency),
      });
    });
  },

  updateSettings: (s) => {
    set((state) => {
      const settings = { ...state.settings, ...s };
      const newState = { ...state, settings };
      saveToStorage(newState);
      return newState;
    });
  },

  setPassword: (password) => {
    set((state) => {
      const settings = {
        ...state.settings,
        privacyPassword: password,
        privacyLockEnabled: !!password,
      };
      const newState = { ...state, settings, isUnlocked: true };
      saveToStorage(newState);
      return newState;
    });
  },

  unlock: (password) => {
    const state = get();
    if (state.settings.privacyPassword === password) {
      set({ isUnlocked: true });
      return true;
    }
    return false;
  },

  lock: () => {
    set({ isUnlocked: false });
  },

  importAll: (data) => {
    set(() => {
      saveToStorage(data);
      return { ...data, isUnlocked: true };
    });
    get().recalculateBalances();
  },

  resetAll: () => {
    const initial: AppData = {
      transactions: [],
      categories: defaultCategories,
      accounts: defaultAccounts,
      budgets: [],
      recurring: [],
      settings: defaultSettings,
    };
    set(() => {
      saveToStorage(initial);
      return { ...initial, isUnlocked: true };
    });
  },

  recalculateBalances: () => {
    set((state) => {
      const balances = new Map<string, number>();
      state.accounts.forEach((a) => balances.set(a.id, 0));

      const sortedTxns = state.transactions
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

      sortedTxns.forEach((t) => {
        if (t.type === 'income') {
          const current = balances.get(t.accountId) ?? 0;
          balances.set(t.accountId, current + t.amount);
        } else if (t.type === 'expense') {
          const current = balances.get(t.accountId) ?? 0;
          balances.set(t.accountId, current - t.amount);
        } else if (t.type === 'transfer') {
          const fromCurrent = balances.get(t.accountId) ?? 0;
          balances.set(t.accountId, fromCurrent - t.amount);
          if (t.toAccountId) {
            const toCurrent = balances.get(t.toAccountId) ?? 0;
            balances.set(t.toAccountId, toCurrent + t.amount);
          }
        } else if (t.type === 'adjustment') {
          let target: number | null = null;
          if (typeof t.adjustmentTargetBalance === 'number') {
            target = t.adjustmentTargetBalance;
          } else {
            const match = t.note.match(/→\s*([-\d.]+)/);
            if (match) target = parseFloat(match[1]);
          }
          if (target !== null && !isNaN(target)) {
            balances.set(t.accountId, target);
          }
        }
      });

      const accounts = state.accounts.map((a) => ({
        ...a,
        balance: balances.get(a.id) ?? 0,
      }));
      const newState = { ...state, accounts };
      saveToStorage(newState);
      return newState;
    });
  },
}));

export const getCategoriesByType = (type: TransactionType): Category[] => {
  return useStore
    .getState()
    .categories.filter((c) => c.type === type)
    .sort((a, b) => a.sort - b.sort);
};

export const getMonthKey = (): string => currentMonthStr();

export interface AccountBalanceAtMonth {
  [accountId: string]: number;
}

export const calculateAccountBalancesUpToMonth = (
  accounts: { id: string }[],
  transactions: Transaction[],
  upToMonthInclusive: string
): AccountBalanceAtMonth => {
  const balances: AccountBalanceAtMonth = {};
  accounts.forEach((a) => {
    balances[a.id] = 0;
  });

  transactions
    .slice()
    .filter((t) => {
      const m = t.date.slice(0, 7);
      return m <= upToMonthInclusive;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .forEach((t) => {
      if (t.type === 'income') {
        balances[t.accountId] = (balances[t.accountId] ?? 0) + t.amount;
      } else if (t.type === 'expense') {
        balances[t.accountId] = (balances[t.accountId] ?? 0) - t.amount;
      } else if (t.type === 'transfer') {
        balances[t.accountId] = (balances[t.accountId] ?? 0) - t.amount;
        if (t.toAccountId) {
          balances[t.toAccountId] = (balances[t.toAccountId] ?? 0) + t.amount;
        }
      } else if (t.type === 'adjustment') {
        let target: number | null = null;
        if (typeof t.adjustmentTargetBalance === 'number') {
          target = t.adjustmentTargetBalance;
        } else {
          const match = t.note.match(/→\s*([-\d.]+)/);
          if (match) target = parseFloat(match[1]);
        }
        if (target !== null && !isNaN(target)) {
          balances[t.accountId] = target;
        }
      }
    });

  return balances;
};
