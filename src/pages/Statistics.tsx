import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { useStore, calculateAccountBalancesUpToMonth } from '@/store/useStore';
import { DynamicIcon } from '@/components/DynamicIcon';
import { PageHeader } from '@/components/Layout/PageHeader';
import { formatMonth, formatMonthCN, getRecentMonths } from '@/utils/date';
import { formatMoney } from '@/utils/money';

type TabType = 'trend' | 'category' | 'account' | 'networth' | 'asset';

const TAB_COLORS = ['#0D9488', '#10B981', '#F97316', '#8B5CF6', '#6366F1'];

export const Statistics = () => {
  const [activeTab, setActiveTab] = useState<TabType>('trend');

  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const allAccounts = useStore((s) => s.accounts);
  const currency = useStore((s) => s.settings.currency);

  const accounts = useMemo(
    () => [...allAccounts].sort((a, b) => a.sort - b.sort),
    [allAccounts]
  );

  const recentMonths = getRecentMonths(6);

  const trendData = useMemo(() => {
    return recentMonths.map((month) => {
      const monthTxns = transactions.filter((t) => formatMonth(t.date) === month);
      const income = monthTxns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return {
        month: formatMonthCN(month).slice(5),
        收入: Math.round(income),
        支出: Math.round(expense),
        结余: Math.round(income - expense),
      };
    });
  }, [transactions, recentMonths]);

  const categoryData = useMemo(() => {
    const currentMonth = recentMonths[recentMonths.length - 1];
    const expenseMap: Record<string, number> = {};

    transactions
      .filter((t) => t.type === 'expense' && formatMonth(t.date) === currentMonth)
      .forEach((t) => {
        expenseMap[t.categoryId] = (expenseMap[t.categoryId] || 0) + t.amount;
      });

    const result = Object.entries(expenseMap)
      .map(([categoryId, value]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return {
          name: cat?.name || '未知',
          value: Math.round(value),
          color: cat?.color || '#6B7280',
        };
      })
      .sort((a, b) => b.value - a.value);

    return result;
  }, [transactions, categories, recentMonths]);

  const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  const accountData = useMemo(() => {
    return accounts
      .map((a) => ({
        name: a.name,
        value: Math.round(a.balance),
        color: a.color,
        icon: a.icon,
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [accounts]);

  const totalAssets = accounts.filter((a) => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter((a) => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  const netWorthData = useMemo(() => {
    let lastNetWorth = 0;
    return recentMonths.map((month) => {
      const monthBalances = calculateAccountBalancesUpToMonth(accounts, transactions, month);
      let monthTotal = 0;
      accounts.forEach((a) => {
        monthTotal += monthBalances[a.id] ?? 0;
      });
      if (monthTotal === 0 && lastNetWorth !== 0) {
        monthTotal = lastNetWorth;
      }
      lastNetWorth = monthTotal;
      return {
        month: formatMonthCN(month).slice(5),
        净资产: Math.round(monthTotal),
      };
    });
  }, [accounts, transactions, recentMonths]);

  const accountTypeData = useMemo(() => {
    const typeMap: Record<string, { label: string; value: number; color: string; icon: string }> = {
      cash: { label: '现金', value: 0, color: '#F97316', icon: 'Wallet' },
      bank: { label: '银行卡', value: 0, color: '#3B82F6', icon: 'CreditCard' },
      wechat: { label: '微信', value: 0, color: '#10B981', icon: 'Smartphone' },
      alipay: { label: '支付宝', value: 0, color: '#06B6D4', icon: 'Smartphone' },
      other: { label: '其他', value: 0, color: '#6B7280', icon: 'MoreHorizontal' },
    };
    accounts.forEach((a) => {
      if (typeMap[a.type]) {
        typeMap[a.type].value += a.balance;
      }
    });
    const result = Object.values(typeMap)
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value);
    return result;
  }, [accounts]);

  const totalAccountTypeValue = accountTypeData.reduce((sum, t) => sum + t.value, 0);

  const accountBalanceTrend = useMemo(() => {
    return recentMonths.map((month) => {
      const balances = calculateAccountBalancesUpToMonth(accounts, transactions, month);
      const row: Record<string, number | string> = { month: formatMonthCN(month).slice(5) };
      accounts.forEach((a) => {
        row[a.name] = Math.round(balances[a.id] ?? 0);
      });
      return row;
    });
  }, [accounts, transactions, recentMonths]);

  const ACCOUNT_TYPE_META = {
    cash: { label: '现金', color: '#F97316' },
    bank: { label: '银行卡', color: '#3B82F6' },
    wechat: { label: '微信', color: '#10B981' },
    alipay: { label: '支付宝', color: '#06B6D4' },
    other: { label: '其他', color: '#6B7280' },
  } as const;

  const accountTypeTrend = useMemo(() => {
    return recentMonths.map((month) => {
      const balances = calculateAccountBalancesUpToMonth(accounts, transactions, month);
      const row: Record<string, number | string> = { month: formatMonthCN(month).slice(5) };
      (Object.keys(ACCOUNT_TYPE_META) as (keyof typeof ACCOUNT_TYPE_META)[]).forEach((type) => {
        const total = accounts
          .filter((a) => a.type === type)
          .reduce((sum, a) => sum + (balances[a.id] ?? 0), 0);
        row[ACCOUNT_TYPE_META[type].label] = Math.round(total);
      });
      return row;
    });
  }, [accounts, transactions, recentMonths]);

  const ACCOUNT_TREND_COLORS = ['#0D9488', '#F97316', '#8B5CF6', '#EC4899', '#6366F1', '#10B981', '#06B6D4', '#F59E0B'];

  const tabs: { key: TabType; label: string }[] = [
    { key: 'trend', label: '收支趋势' },
    { key: 'category', label: '消费占比' },
    { key: 'account', label: '账户余额' },
    { key: 'asset', label: '资产分析' },
    { key: 'networth', label: '净资产' },
  ];

  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 md:px-6 pt-8 pb-12 md:pb-16 rounded-b-[2rem]">
        <PageHeader
          title="统计"
          subtitle="全面了解您的财务状况"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="text-white/70 text-xs mb-1">本月收入</div>
            <div className="text-white font-bold text-lg">
              {formatMoney(trendData[trendData.length - 1]?.收入 || 0, currency)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="text-white/70 text-xs mb-1">本月支出</div>
            <div className="text-white font-bold text-lg">
              {formatMoney(trendData[trendData.length - 1]?.支出 || 0, currency)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="text-white/70 text-xs mb-1">本月结余</div>
            <div className="text-white font-bold text-lg">
              {formatMoney(trendData[trendData.length - 1]?.结余 || 0, currency)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="text-white/70 text-xs mb-1">净资产</div>
            <div className="text-white font-bold text-lg">
              {formatMoney(netWorth, currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 -mt-6">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 inline-flex gap-1 w-full overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={activeTab === tab.key ? { backgroundColor: TAB_COLORS[idx] } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 mt-4 space-y-4">
        {activeTab === 'trend' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-4">近6个月收支趋势</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => formatMoney(value, currency)}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="收入" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="支出" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="结余" stroke="#0D9488" strokeWidth={3} dot={{ fill: '#0D9488', r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-800">本月消费占比</h4>
                <span className="text-sm text-slate-500">总计 {formatMoney(totalExpense, currency)}</span>
              </div>
              {categoryData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-400">
                  暂无支出数据
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatMoney(value, currency), '金额']}
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value: string) => <span className="text-slate-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {categoryData.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-4">分类明细</h4>
                <div className="space-y-3">
                  {categoryData.map((item, idx) => {
                    const percentage = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                          <DynamicIcon name={categories.find((c) => c.name === item.name)?.icon || 'MoreHorizontal'} size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                            <span className="text-sm font-semibold text-slate-800">{formatMoney(item.value, currency)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">总资产</div>
                <div className="text-2xl font-bold text-emerald-600">{formatMoney(totalAssets, currency)}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">总负债</div>
                <div className="text-2xl font-bold text-red-500">{formatMoney(totalLiabilities, currency)}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">净资产</div>
                <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                  {formatMoney(netWorth, currency)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">账户分布</h4>
              {accountData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-400">
                  暂无账户数据
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip
                        formatter={(value: number) => formatMoney(value, currency)}
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {accountData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">账户列表</h4>
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                    >
                      <DynamicIcon name={acc.icon} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">{acc.name}</div>
                    </div>
                    <div className={`text-base font-bold ${acc.balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                      {formatMoney(acc.balance, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'asset' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-800">资产类型分布</h4>
                <span className="text-sm text-slate-500">总计 {formatMoney(totalAccountTypeValue, currency)}</span>
              </div>
              {accountTypeData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-400">
                  暂无资产数据
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {accountTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatMoney(value, currency), '金额']}
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value: string) => <span className="text-slate-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {accountTypeData.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-4">类型明细</h4>
                <div className="space-y-3">
                  {accountTypeData.map((item, idx) => {
                    const percentage = totalAccountTypeValue > 0 ? (item.value / totalAccountTypeValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                          <DynamicIcon name={item.icon} size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{item.label}</span>
                            <span className="text-sm font-semibold text-slate-800">{formatMoney(item.value, currency)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">资产类型近6个月变化趋势</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accountTypeTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => formatMoney(value, currency)}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {(Object.values(ACCOUNT_TYPE_META)).map((meta) => (
                      <Line
                        key={meta.label}
                        type="monotone"
                        dataKey={meta.label}
                        stroke={meta.color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: meta.color }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">各账户近6个月余额变化</h4>
              {accounts.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-400">
                  暂无账户数据
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accountBalanceTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => formatMoney(value, currency)}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {accounts.map((acc, idx) => (
                        <Line
                          key={acc.id}
                          type="monotone"
                          dataKey={acc.name}
                          stroke={ACCOUNT_TREND_COLORS[idx % ACCOUNT_TREND_COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: ACCOUNT_TREND_COLORS[idx % ACCOUNT_TREND_COLORS.length] }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'networth' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-4">净资产变化趋势</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={netWorthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => formatMoney(value, currency)}
                  />
                  <Line
                    type="monotone"
                    dataKey="净资产"
                    stroke="#0D9488"
                    strokeWidth={3}
                    fill="url(#netWorthGradient)"
                    dot={{ fill: '#0D9488', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
