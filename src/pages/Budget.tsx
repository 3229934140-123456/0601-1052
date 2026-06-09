import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, AlertTriangle, X, TrendingDown, BarChart3, CalendarRange } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DynamicIcon } from '@/components/DynamicIcon';
import { ProgressBar } from '@/components/ProgressBar';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/Layout/PageHeader';
import { formatMonthCN, currentMonthStr, getRecentMonths, formatMonth, formatDateCN } from '@/utils/date';
import { formatMoney } from '@/utils/money';

type RangeType = 'month' | 'quarter' | 'year';

export const Budget = () => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [rangeType, setRangeType] = useState<RangeType>('month');
  const [showTotalBudgetModal, setShowTotalBudgetModal] = useState(false);
  const [showCategoryBudgetModal, setShowCategoryBudgetModal] = useState<string | null>(null);
  const [showCategoryDetailModal, setShowCategoryDetailModal] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  const transactions = useStore((s) => s.transactions);
  const allCategories = useStore((s) => s.categories);
  const allAccounts = useStore((s) => s.accounts);
  const budgets = useStore((s) => s.budgets);

  const categories = useMemo(
    () => allCategories.filter((c) => c.type === 'expense').sort((a, b) => a.sort - b.sort),
    [allCategories]
  );
  const currency = useStore((s) => s.settings.currency);
  const setBudget = useStore((s) => s.setBudget);
  const deleteBudget = useStore((s) => s.deleteBudget);

  const monthOptions = getRecentMonths(12);
  const recent6Months = getRecentMonths(6);

  const rangeMonths = useMemo(() => {
    const idx = monthOptions.indexOf(selectedMonth);
    if (rangeType === 'month') return [selectedMonth];
    if (rangeType === 'quarter') {
      const start = Math.min(Math.max(idx - (idx % 3), 0), Math.max(monthOptions.length - 3, 0));
      return monthOptions.slice(start, start + 3);
    }
    const start = Math.min(Math.max(idx - (idx % 12), 0), Math.max(monthOptions.length - 12, 0));
    return monthOptions.slice(start, start + 12);
  }, [selectedMonth, rangeType, monthOptions]);

  const rangeLabel = useMemo(() => {
    if (rangeType === 'month') return formatMonthCN(selectedMonth);
    if (rangeMonths.length === 0) return '';
    const first = rangeMonths[0];
    const last = rangeMonths[rangeMonths.length - 1];
    if (rangeType === 'quarter') return `${formatMonthCN(first)} ~ ${formatMonthCN(last).slice(5)}`;
    return `${formatMonthCN(first)} ~ ${formatMonthCN(last).slice(5)}`;
  }, [rangeType, selectedMonth, rangeMonths]);

  const rangeExpense = useMemo(() => {
    return transactions
      .filter((t) => rangeMonths.includes(formatMonth(t.date)) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, rangeMonths]);

  const rangeCategoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => rangeMonths.includes(formatMonth(t.date)) && t.type === 'expense')
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return map;
  }, [transactions, rangeMonths]);

  const getRangeCategoryTransactions = (categoryId: string) => {
    return transactions
      .filter((t) => rangeMonths.includes(formatMonth(t.date)) && t.categoryId === categoryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  };

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

  const recentMonthStats = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    recent6Months.forEach((m) => {
      stats[m] = {};
    });
    transactions
      .filter((t) => t.type === 'expense' && recent6Months.includes(formatMonth(t.date)))
      .forEach((t) => {
        const m = formatMonth(t.date);
        stats[m][t.categoryId] = (stats[m][t.categoryId] || 0) + t.amount;
      });
    return stats;
  }, [transactions, recent6Months]);

  const getCategoryRecentMonths = (categoryId: string) => {
    return recent6Months.map((m) => {
      const budget = budgets.find((b) => b.month === m && b.categoryId === categoryId)?.amount ?? 0;
      const spent = recentMonthStats[m]?.[categoryId] || 0;
      return {
        month: m,
        budget,
        spent,
        remaining: budget - spent,
        isOver: budget > 0 && spent > budget,
      };
    });
  };

  const getCategoryTransactions = (categoryId: string) => {
    return transactions
      .filter((t) => formatMonth(t.date) === selectedMonth && t.categoryId === categoryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  };

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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const idx = monthOptions.indexOf(selectedMonth);
                  const step = rangeType === 'year' ? 12 : rangeType === 'quarter' ? 3 : 1;
                  const nextIdx = Math.min(idx + step, monthOptions.length - 1);
                  setSelectedMonth(monthOptions[nextIdx]);
                }}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-white text-xl font-bold min-w-[160px] text-center">
                {rangeLabel}
              </h3>
              <button
                onClick={() => {
                  const idx = monthOptions.indexOf(selectedMonth);
                  const step = rangeType === 'year' ? 12 : rangeType === 'quarter' ? 3 : 1;
                  const nextIdx = Math.max(idx - step, 0);
                  setSelectedMonth(monthOptions[nextIdx]);
                }}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="inline-flex p-1 bg-white/10 backdrop-blur rounded-xl gap-1">
            {([
              { key: 'month' as RangeType, label: '月度' },
              { key: 'quarter' as RangeType, label: '季度' },
              { key: 'year' as RangeType, label: '年度' },
            ]).map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeType(r.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  rangeType === r.key
                    ? 'bg-white text-amber-600 shadow'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">
              {rangeType === 'month' ? '月度总预算' : `${rangeMonths.length}个月累计`}
            </span>
            <button
              onClick={openTotalBudgetModal}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm"
            >
              {totalBudget > 0 ? <Edit2 size={16} /> : <Plus size={16} />}
              <span>{totalBudget > 0 ? '修改' : '设置'}</span>
            </button>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-white text-4xl font-bold">
              {formatMoney(rangeExpense, currency)}
            </span>
            {rangeMonths.length > 1 && (
              <span className="text-white/70 text-sm">
                月均 {formatMoney(rangeExpense / rangeMonths.length, currency)}
              </span>
            )}
          </div>

          {totalBudget > 0 && rangeType === 'month' && (
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

          {isOverBudget && rangeType === 'month' && (
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
              const spent = rangeType === 'month' ? (categoryExpenses[cat.id] || 0) : (rangeCategoryExpenses[cat.id] || 0);
              const remaining = (budget?.amount || 0) - (categoryExpenses[cat.id] || 0);
              const isOver = (budget?.amount || 0) > 0 && (categoryExpenses[cat.id] || 0) > (budget?.amount || 0);
              const recentStats = getCategoryRecentMonths(cat.id);
              const overBudgetCount = recentStats.filter((s) => s.isOver).length;

              return (
                <div key={cat.id} className="group">
                  <div
                    className="flex items-center gap-3 mb-2 cursor-pointer"
                    onClick={() => setShowCategoryDetailModal(cat.id)}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                        {overBudgetCount >= 2 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-medium">
                            <TrendingDown size={10} />
                            近{overBudgetCount}月超支
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCategoryBudgetModal(cat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      {budget ? <Edit2 size={16} /> : <Plus size={16} />}
                    </button>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>

                  {budget && rangeType === 'month' ? (
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
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-slate-500">
                          {rangeMonths.length > 1 ? `${rangeMonths.length}个月累计` : '本月支出'}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {formatMoney(spent, currency)}
                          {rangeMonths.length > 1 && (
                            <span className="text-xs text-slate-400 ml-2 font-normal">
                              月均 {formatMoney(spent / rangeMonths.length, currency)}
                            </span>
                          )}
                        </span>
                      </div>
                      {rangeType === 'month' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCategoryBudgetModal(cat.id);
                          }}
                          className="w-full mt-1 py-1.5 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus size={12} />
                          <span>设置预算</span>
                        </button>
                      )}
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

      <Modal
        open={!!showCategoryDetailModal}
        onClose={() => setShowCategoryDetailModal(null)}
        title="预算执行详情"
      >
        {showCategoryDetailModal && (() => {
          const cat = categories.find((c) => c.id === showCategoryDetailModal);
          if (!cat) return null;
          const budget = categoryBudgets.find((b) => b.categoryId === cat.id);
          const spent = rangeType === 'month' ? (categoryExpenses[cat.id] || 0) : (rangeCategoryExpenses[cat.id] || 0);
          const monthSpent = categoryExpenses[cat.id] || 0;
          const remaining = (budget?.amount || 0) - monthSpent;
          const isOver = (budget?.amount || 0) > 0 && monthSpent > (budget?.amount || 0);
          const recentStats = getCategoryRecentMonths(cat.id);
          const catTxns = rangeType === 'month' ? getCategoryTransactions(cat.id) : getRangeCategoryTransactions(cat.id);

          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <DynamicIcon name={cat.icon} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-lg">{cat.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <CalendarRange size={12} />
                    {rangeLabel}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-slate-500">
                    {rangeMonths.length > 1 ? `${rangeMonths.length}个月累计支出` : '本月支出'}
                  </span>
                  <span className="text-xl font-bold text-slate-800">{formatMoney(spent, currency)}</span>
                </div>
                {rangeMonths.length > 1 && (
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-sm text-slate-500">月均支出</span>
                    <span className="text-base font-semibold text-slate-600">
                      {formatMoney(spent / rangeMonths.length, currency)}
                    </span>
                  </div>
                )}
                {budget && rangeType === 'month' && (
                  <>
                    <div className="pt-2 border-t border-slate-200/60" />
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-slate-500">本月预算</span>
                      <span className="text-base font-semibold text-slate-700">{formatMoney(budget.amount, currency)}</span>
                    </div>
                    <ProgressBar
                      value={monthSpent}
                      max={budget.amount}
                      color="bg-teal-500"
                      warningColor="bg-amber-500"
                      dangerColor="bg-red-500"
                      height="h-2.5"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        已支出 <span className="font-semibold">{formatMoney(monthSpent, currency)}</span>
                      </span>
                      <span className={isOver ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                        {remaining >= 0 ? `剩余 ${formatMoney(remaining, currency)}` : `超支 ${formatMoney(Math.abs(remaining), currency)}`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">近6个月执行情况</h5>
                <div className="space-y-2">
                  {recentStats.map((s) => (
                    <div key={s.month} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-16">{formatMonthCN(s.month).slice(5)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600">
                            {formatMoney(s.spent, currency)}
                            {s.budget > 0 && <span className="text-slate-400"> / {formatMoney(s.budget, currency)}</span>}
                          </span>
                          {s.isOver && <span className="text-red-500 font-medium">超支</span>}
                          {!s.isOver && s.budget > 0 && <span className="text-teal-600 font-medium">正常</span>}
                          {s.budget === 0 && <span className="text-slate-400">未设</span>}
                        </div>
                        {s.budget > 0 && (
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.isOver ? 'bg-red-500' : 'bg-teal-500'}`}
                              style={{ width: `${Math.min((s.spent / s.budget) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  {rangeMonths.length > 1 ? `${rangeMonths.length}个月账单` : '本月账单'} ({catTxns.length}条)
                </h5>
                {catTxns.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    暂无相关账单
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {catTxns.map((t) => {
                      const acc = allAccounts.find((a) => a.id === t.accountId);
                      return (
                        <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-400 w-14">{t.date.slice(0)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-700 truncate">
                              {t.note || cat.name}
                            </div>
                            <div className="text-xs text-slate-400">{acc?.name}</div>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">
                            -{formatMoney(t.amount, currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
