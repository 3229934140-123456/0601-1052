import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2, Filter, Check, X, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/Layout/PageHeader';
import { formatDateCN, formatMonthCN, currentMonthStr, getRecentMonths, formatMonth } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import type { Transaction, TransactionType } from '@/types';

export const Ledger = () => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterAccount, setFilterAccount] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<TransactionType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCategoryId, setBatchCategoryId] = useState('');
  const [batchAccountId, setBatchAccountId] = useState('');

  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const currency = useStore((s) => s.settings.currency);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const deleteTransactions = useStore((s) => s.deleteTransactions);

  const monthOptions = getRecentMonths(12);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => formatMonth(t.date) === selectedMonth)
      .filter((t) => !filterCategory || t.categoryId === filterCategory)
      .filter((t) => !filterAccount || t.accountId === filterAccount)
      .filter((t) => !filterType || t.type === filterType)
      .filter((t) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === t.categoryId);
        const acc = accounts.find((a) => a.id === t.accountId);
        return (
          t.note.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q) ||
          acc?.name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, selectedMonth, filterCategory, filterAccount, filterType, searchQuery, categories, accounts]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const monthStats = useMemo(() => {
    const monthTxns = transactions.filter((t) => formatMonth(t.date) === selectedMonth);
    const income = monthTxns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions, selectedMonth]);

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || '未知账户';

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size > 0 && confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) {
      deleteTransactions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBatchUpdate = () => {
    if (selectedIds.size === 0) return;
    Array.from(selectedIds).forEach((id) => {
      const updates: Partial<Transaction> = {};
      if (batchCategoryId) updates.categoryId = batchCategoryId;
      if (batchAccountId) updates.accountId = batchAccountId;
      if (Object.keys(updates).length > 0) {
        updateTransaction(id, updates);
      }
    });
    setSelectedIds(new Set());
    setBatchCategoryId('');
    setBatchAccountId('');
    setShowBatchModal(false);
  };

  const handleEditSave = (t: Transaction) => {
    updateTransaction(t.id, {
      amount: t.amount,
      categoryId: t.categoryId,
      accountId: t.accountId,
      date: t.date,
      note: t.note,
      type: t.type,
    });
    setEditingTransaction(null);
  };

  const clearFilters = () => {
    setFilterCategory(null);
    setFilterAccount(null);
    setFilterType(null);
    setSearchQuery('');
  };

  const hasFilters = filterCategory || filterAccount || filterType || searchQuery;

  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 md:px-6 pt-8 pb-12 md:pb-16 rounded-b-[2rem]">
        <PageHeader
          title="账本"
          subtitle="查看和管理您的所有账单记录"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const idx = monthOptions.indexOf(selectedMonth);
                if (idx < monthOptions.length - 1) setSelectedMonth(monthOptions[idx + 1]);
              }}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-white text-xl font-bold min-w-[120px] text-center">
              {formatMonthCN(selectedMonth)}
            </h3>
            <button
              onClick={() => {
                const idx = monthOptions.indexOf(selectedMonth);
                if (idx > 0) setSelectedMonth(monthOptions[idx - 1]);
              }}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="text-white/70 text-xs mb-1">收入</div>
            <div className="text-white font-bold text-lg">{formatMoney(monthStats.income, currency)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="text-white/70 text-xs mb-1">支出</div>
            <div className="text-white font-bold text-lg">{formatMoney(monthStats.expense, currency)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="text-white/70 text-xs mb-1">结余</div>
            <div className="text-white font-bold text-lg">{formatMoney(monthStats.balance, currency)}</div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 -mt-6 space-y-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索备注、分类、账户..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-sm outline-none focus:bg-slate-100 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-colors ${
                hasFilters ? 'bg-teal-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter size={18} />
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-teal-50 text-teal-600 text-sm font-medium hover:bg-teal-100 transition-colors"
                >
                  批量修改 ({selectedIds.size})
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  批量删除
                </button>
              </>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 w-12">类型:</span>
                <button
                  onClick={() => setFilterType(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === null ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === 'income' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  收入
                </button>
              </div>

              <div className="flex flex-wrap items-start gap-2">
                <span className="text-xs text-slate-500 w-12 pt-1.5">分类:</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  <button
                    onClick={() => setFilterCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterCategory === null ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    全部
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFilterCategory(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterCategory === c.id
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-2">
                <span className="text-xs text-slate-500 w-12 pt-1.5">账户:</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  <button
                    onClick={() => setFilterAccount(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterAccount === null ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    全部
                  </button>
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setFilterAccount(a.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterAccount === a.id
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  清除所有筛选
                </button>
              )}
            </div>
          )}
        </div>

        {filteredTransactions.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={toggleSelectAll}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedIds.size === filteredTransactions.length && selectedIds.size > 0
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Check size={16} />
            </button>
            <span className="text-xs text-slate-500">
              已选 {selectedIds.size} / {filteredTransactions.length} 条
            </span>
          </div>
        )}

        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Search size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">暂无账单记录</p>
            <p className="text-sm text-slate-400 mt-1">快去"记一笔"添加您的第一条记录吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, txns]) => {
              const dayIncome = txns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
              const dayExpense = txns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

              return (
                <div key={date} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">{formatDateCN(date)}</span>
                    <div className="flex items-center gap-3 text-xs">
                      {dayIncome > 0 && (
                        <span className="text-emerald-600">收 {formatMoney(dayIncome, currency)}</span>
                      )}
                      {dayExpense > 0 && (
                        <span className="text-red-500">支 {formatMoney(dayExpense, currency)}</span>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {txns.map((t) => {
                      const cat = categories.find((c) => c.id === t.categoryId);
                      const acc = accounts.find((a) => a.id === t.accountId);
                      const toAcc = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId) : null;
                      const isSelected = selectedIds.has(t.id);
                      const isTransfer = t.type === 'transfer';
                      const isAdjustment = t.type === 'adjustment';

                      let displayText = cat?.name || '未知';
                      let subText = acc?.name || '未知账户';
                      let amountText = '';
                      let amountClass = 'text-slate-800';

                      if (isTransfer) {
                        displayText = `${acc?.name || '?'} → ${toAcc?.name || '?'}`;
                        subText = t.note || '账户转账';
                        amountText = formatMoney(t.amount, currency);
                        amountClass = 'text-indigo-600';
                      } else if (isAdjustment) {
                        const diff = typeof t.adjustmentDiff === 'number'
                          ? t.adjustmentDiff
                          : (() => {
                              const match = t.note.match(/[（(]\s*([+-]?\d+\.?\d*)\s*[)）]/) || t.note.match(/→\s*([-\d.]+)/);
                              if (match && typeof t.adjustmentTargetBalance === 'number') {
                                return t.adjustmentTargetBalance > 0 ? t.amount : -t.amount;
                              }
                              return 0;
                            })();
                        const hasCustomNote = t.note && !t.note.includes('余额校准：') && !t.note.includes('→');
                        displayText = `余额校准 ${diff >= 0 ? '+' : ''}${formatMoney(diff, currency)}`;
                        subText = hasCustomNote ? `${acc?.name || '未知账户'} · ${t.note}` : `${acc?.name || '未知账户'}${typeof t.adjustmentTargetBalance === 'number' ? ` → ${formatMoney(t.adjustmentTargetBalance, currency)}` : ''}`;
                        amountText = '';
                        amountClass = 'text-violet-600';
                      } else if (t.type === 'income') {
                        amountText = `+${formatMoney(t.amount, currency)}`;
                        amountClass = 'text-emerald-600';
                      } else {
                        amountText = `-${formatMoney(t.amount, currency)}`;
                      }

                      return (
                        <div
                          key={t.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                            isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <button
                            onClick={() => toggleSelect(t.id)}
                            className={`p-1 rounded-lg transition-colors shrink-0 ${
                              isSelected ? 'bg-teal-500 text-white' : 'bg-slate-100 text-transparent hover:text-slate-400'
                            }`}
                          >
                            <Check size={14} />
                          </button>

                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat?.color || '#6B7280'}15`, color: cat?.color || '#6B7280' }}
                          >
                            <DynamicIcon name={cat?.icon || 'MoreHorizontal'} size={20} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 truncate">{displayText}</span>
                              {!isTransfer && !isAdjustment && t.note && (
                                <span className="text-xs text-slate-400 truncate">· {t.note}</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{subText}</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={`text-sm font-bold ${amountClass}`}>
                              {amountText}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!isTransfer && !isAdjustment && (
                              <button
                                onClick={() => setEditingTransaction(t)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('确定要删除这条记录吗？')) {
                                  deleteTransaction(t.id);
                                }
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="编辑账单"
      >
        {editingTransaction && (
          <EditTransactionForm
            transaction={editingTransaction}
            categories={categories}
            accounts={accounts}
            currency={currency}
            onSave={handleEditSave}
            onCancel={() => setEditingTransaction(null)}
          />
        )}
      </Modal>

      <Modal
        open={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setBatchCategoryId('');
          setBatchAccountId('');
        }}
        title={`批量修改 ${selectedIds.size} 条记录`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">分类（可选）</label>
            <select
              value={batchCategoryId}
              onChange={(e) => setBatchCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
            >
              <option value="">不修改</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">账户（可选）</label>
            <select
              value={batchAccountId}
              onChange={(e) => setBatchAccountId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
            >
              <option value="">不修改</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowBatchModal(false);
                setBatchCategoryId('');
                setBatchAccountId('');
              }}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleBatchUpdate}
              disabled={!batchCategoryId && !batchAccountId}
              className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认修改
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

interface EditFormProps {
  transaction: Transaction;
  categories: { id: string; name: string; type: TransactionType; icon: string; color: string; sort: number }[];
  accounts: { id: string; name: string; icon: string; color: string }[];
  currency: string;
  onSave: (t: Transaction) => void;
  onCancel: () => void;
}

const EditTransactionForm = ({ transaction, categories, accounts, currency, onSave, onCancel }: EditFormProps) => {
  const [t, setT] = useState<Transaction>(transaction);

  const handleTypeChange = (type: TransactionType) => {
    const sameTypeCategories = categories.filter((c) => c.type === type).sort((a, b) => a.sort - b.sort);
    const currentCategoryValid = sameTypeCategories.some((c) => c.id === t.categoryId);
    setT({
      ...t,
      type,
      categoryId: currentCategoryValid ? t.categoryId : sameTypeCategories[0]?.id || '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => handleTypeChange('expense')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            t.type === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-600'
          }`}
        >
          支出
        </button>
        <button
          onClick={() => handleTypeChange('income')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            t.type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-600'
          }`}
        >
          收入
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">金额</label>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50">
          <span className="text-slate-500 text-lg">{currency}</span>
          <input
            type="number"
            step="0.01"
            value={t.amount}
            onChange={(e) => setT({ ...t, amount: parseFloat(e.target.value) || 0 })}
            className="flex-1 bg-transparent text-xl font-bold outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
        <select
          value={t.categoryId}
          onChange={(e) => setT({ ...t, categoryId: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
        >
          {categories.filter((c) => c.type === t.type).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">账户</label>
        <select
          value={t.accountId}
          onChange={(e) => setT({ ...t, accountId: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">日期</label>
        <input
          type="date"
          value={t.date}
          onChange={(e) => setT({ ...t, date: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">备注</label>
        <input
          type="text"
          value={t.note}
          onChange={(e) => setT({ ...t, note: e.target.value })}
          placeholder="添加备注..."
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
        />
      </div>

      {t.image && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">凭证</label>
          <img src={t.image} alt="凭证" className="w-32 h-32 rounded-xl object-cover" />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => onSave(t)}
          className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
};
