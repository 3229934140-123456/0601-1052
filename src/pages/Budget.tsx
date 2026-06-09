import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DynamicIcon } from '@/components/DynamicIcon';
import { ProgressBar } from '@/components/ProgressBar';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/Layout/PageHeader';
import { formatMonthCN, currentMonthStr, getRecentMonths, formatMonth } from '@/utils/date';
import { formatMoney } from '@/utils/money';

export const Budget = () => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [showTotalBudgetModal, setShowTotalBudgetModal] = useState(false);
  const [showCategoryBudgetModal, setShowCategoryBudgetModal] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  const transactions = useStore((s) => s.transactions);
  const allCategories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);

  const categories = useMemo(
    () => allCategories.filter((c) => c.type === 'expense').sort((a, b) => a.sort - b.sort),
    [allCategories]
  );
  const currency = useStore((s) => s.settings.currency);
  const setBudget = useStore((s) => s.setBudget);
  const deleteBudget = useStore((s) => s.deleteBudget);

  const monthOptions = getRecentMonths(12);

  const totalBudget = useMemo(() => {
    return budgets.find((b) => b.month === selectedMonth && b.categoryId === null)?.amount ?? 0;
  }, [budgets, selectedMonth]);

  const categoryBudgets = useMemo(() => {
    return budgets.filter((b) => b.month === selectedMonth && b.categoryId !== null);
  }, [budgets, selectedMonth]);

  const monthExpense = useMemo(() => {
    return transactions
      .filter((t) => formatMonth(t.date) === selectedMonth && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedMonth]);

  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => formatMonth(t.date) === selectedMonth && t.type === 'expense')
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return map;
  }, [transactions, selectedMonth]);

  const totalBudgetFromCategories = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);

  const openTotalBudgetModal = () => {
    setBudgetAmount(totalBudget > 0 ? totalBudget.toString() : '');
    setShowTotalBudgetModal(true);
  };

  const openCategoryBudgetModal = (categoryId: string) => {
    const existing = categoryBudgets.find((b) => b.categoryId === categoryId);
    setBudgetAmount(existing ? existing.amount.toString() : '');
    setShowCategoryBudgetModal(categoryId);
  };

  const handleSaveTotalBudget = () => {
    const amount = parseFloat(budgetAmount);
    if (amount >= 0) {
      setBudget(selectedMonth, null, amount);
    }
    setShowTotalBudgetModal(false);
    setBudgetAmount('');
  };

  const handleSaveCategoryBudget = () => {
    const amount = parseFloat(budgetAmount);
    if (amount >= 0 && showCategoryBudgetModal) {
      if (amount === 0) {
        const existing = categoryBudgets.find((b) => b.categoryId === showCategoryBudgetModal);
        if (existing) deleteBudget(existing.id);
      } else {
        setBudget(selectedMonth, showCategoryBudgetModal, amount);
      }
    }
    setShowCategoryBudgetModal(null);
    setBudgetAmount('');
  };

  const totalRemaining = totalBudget - monthExpense;
  const isOverBudget = totalBudget > 0 && monthExpense > totalBudget;

  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      <div
        className={`px-4 md:px-6 pt-8 pb-12 md:pb-16 rounded-b-[2rem] ${
          isOverBudget
            ? 'bg-gradient-to-r from-red-500 to-orange-500'
            : 'bg-gradient-to-r from-amber-500 to-orange-500'
        }`}
      >
        <PageHeader
          title="预算"
          subtitle="设置并监控您的月度消费预算"
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

        <div className="mt-6 bg-white/10 backdrop-blur rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">月度总预算</span>
            <button
              onClick={openTotalBudgetModal}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm"
            >
              {totalBudget > 0 ? <Edit2 size={16} /> : <Plus size={16} />}
              <span>{totalBudget > 0 ? '修改' : '设置'}</span>
            </button>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-white text-4xl font-bold">{formatMoney(totalBudget, currency)}</span>
          </div>

          {totalBudget > 0 && (
            <>
              <ProgressBar
                value={monthExpense}
                max={totalBudget}
                color="bg-white"
                warningColor="bg-amber-200"
                dangerColor="bg-white"
                height="h-3"
              />
              <div className="flex justify-between mt-3 text-sm">
                <div>
                  <span className="text-white/70">已支出 </span>
                  <span className="text-white font-semibold">{formatMoney(monthExpense, currency)}</span>
                </div>
                <div>
                  <span className="text-white/70">{totalRemaining >= 0 ? '剩余 ' : '超支 '}</span>
                  <span className={`font-semibold ${totalRemaining >= 0 ? 'text-white' : 'text-amber-100'}`}>
                    {formatMoney(Math.abs(totalRemaining), currency)}
                  </span>
                </div>
              </div>
            </>
          )}

          {isOverBudget && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/15">
              <AlertTriangle size={20} className="text-amber-100 shrink-0" />
              <span className="text-sm text-white font-medium">本月已超出预算，请控制消费！</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 -mt-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-semibold text-slate-800">分类预算</h4>
            {totalBudgetFromCategories > 0 && totalBudget > 0 && (
              <span className="text-xs text-slate-500">
                分类预算合计 {formatMoney(totalBudgetFromCategories, currency)}
                {totalBudgetFromCategories > totalBudget && (
                  <span className="ml-1 text-amber-600">（超过总预算）</span>
                )}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const budget = categoryBudgets.find((b) => b.categoryId === cat.id);
              const spent = categoryExpenses[cat.id] || 0;
              const remaining = (budget?.amount || 0) - spent;
              const isOver = (budget?.amount || 0) > 0 && spent > (budget?.amount || 0);

              return (
                <div key={cat.id} className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 flex-1">{cat.name}</span>
                    <button
                      onClick={() => openCategoryBudgetModal(cat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      {budget ? <Edit2 size={16} /> : <Plus size={16} />}
                    </button>
                  </div>

                  {budget ? (
                    <div className="pl-12">
                      <ProgressBar
                        value={spent}
                        max={budget.amount}
                        color="bg-teal-500"
                        warningColor="bg-amber-500"
                        dangerColor="bg-red-500"
                      />
                      <div className="flex justify-between mt-1.5 text-xs">
                        <span className="text-slate-500">
                          已用 {formatMoney(spent, currency)}
                        </span>
                        <span className={isOver ? 'text-red-500 font-medium' : 'text-slate-500'}>
                          {remaining >= 0 ? `剩 ${formatMoney(remaining, currency)}` : `超 ${formatMoney(Math.abs(remaining), currency)}`}
                          <span className="text-slate-400 ml-1">/ {formatMoney(budget.amount, currency)}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-12">
                      <button
                        onClick={() => openCategoryBudgetModal(cat.id)}
                        className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus size={14} />
                        <span>设置预算</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={showTotalBudgetModal}
        onClose={() => setShowTotalBudgetModal(false)}
        title="设置月度总预算"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">预算金额</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50">
              <span className="text-slate-500 text-lg">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl font-bold outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowTotalBudgetModal(false)}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveTotalBudget}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!showCategoryBudgetModal}
        onClose={() => {
          setShowCategoryBudgetModal(null);
          setBudgetAmount('');
        }}
        title="设置分类预算"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">预算金额（设为0则删除）</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50">
              <span className="text-slate-500 text-lg">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl font-bold outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowCategoryBudgetModal(null);
                setBudgetAmount('');
              }}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveCategoryBudget}
              className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
