import { useState, useRef, useMemo } from 'react';
import {
  ChevronRight, Plus, Edit2, Trash2, Tag, Wallet, RefreshCcw,
  Download, Upload, Lock, Unlock, AlertTriangle, Check, Eye, EyeOff,
  RefreshCw, ArrowRightLeft, Scale, History, X, SkipForward, Zap, Calendar,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/Layout/PageHeader';
import { exportData, importData } from '@/utils/export';
import { todayStr, formatDateCN, getUpcomingDates } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import type { Category, Account, Recurring, TransactionType, Frequency } from '@/types';

type SectionType = 'categories' | 'accounts' | 'recurring' | null;

const ICON_OPTIONS = [
  'UtensilsCrossed', 'Car', 'ShoppingBag', 'Gamepad2', 'Home', 'Heart',
  'GraduationCap', 'Briefcase', 'Gift', 'TrendingUp', 'Clock', 'Coins',
  'Wallet', 'Landmark', 'Smartphone', 'MessageCircle', 'MoreHorizontal',
  'PiggyBank', 'CreditCard', 'Building2',
];

const COLOR_OPTIONS = [
  '#F97316', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#EF4444',
  '#6366F1', '#10B981', '#22C55E', '#06B6D4', '#F59E0B', '#6B7280',
];

export const Settings = () => {
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const store = useStore();
  const currency = store.settings.currency;

  const handleExport = () => {
    const data = {
      transactions: store.transactions,
      categories: store.categories,
      accounts: store.accounts,
      budgets: store.budgets,
      recurring: store.recurring,
      settings: store.settings,
    };
    exportData(data);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');

    try {
      const data = await importData(file);
      if (confirm('导入将覆盖现有数据，确定继续吗？')) {
        store.importAll(data);
        alert('导入成功！');
      }
    } catch (err) {
      setImportError((err as Error).message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetPassword = () => {
    if (password && password !== passwordConfirm) {
      alert('两次输入的密码不一致');
      return;
    }
    store.setPassword(password);
    setShowPasswordModal(false);
    setPassword('');
    setPasswordConfirm('');
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      if (confirm('再次确认：所有账单、分类、账户、预算等数据都将被清空，确定吗？')) {
        store.resetAll();
      }
    }
  };

  const sections = [
    { key: 'categories' as const, label: '分类管理', icon: Tag, desc: '管理收支分类' },
    { key: 'accounts' as const, label: '账户管理', icon: Wallet, desc: '管理资金账户' },
    { key: 'recurring' as const, label: '周期账单', icon: RefreshCcw, desc: '定期自动记账' },
  ];

  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-4 md:px-6 pt-8 pb-12 md:pb-16 rounded-b-[2rem]">
        <PageHeader
          title="设置"
          subtitle="个性化您的记账体验"
        />
      </div>

      <div className="px-4 md:px-6 -mt-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {sections.map((section, idx) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left ${
                idx < sections.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <section.icon size={20} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">{section.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{section.desc}</div>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Download size={20} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">导出数据</div>
              <div className="text-xs text-slate-500 mt-0.5">将所有数据导出为 JSON 文件备份</div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          <button
            onClick={handleImportClick}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Upload size={20} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">导入数据</div>
              <div className="text-xs text-slate-500 mt-0.5">从 JSON 备份文件恢复数据</div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          {importError && (
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs">
                <AlertTriangle size={14} />
                <span>{importError}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              {store.settings.privacyLockEnabled ? <Lock size={20} /> : <Unlock size={20} />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">隐私锁</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {store.settings.privacyLockEnabled ? '已启用，打开应用需要输入密码' : '未启用'}
              </div>
            </div>
            <button
              onClick={() => {
                if (store.settings.privacyLockEnabled) {
                  if (confirm('确定要关闭隐私锁吗？')) {
                    store.setPassword('');
                  }
                } else {
                  setShowPasswordModal(true);
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                store.settings.privacyLockEnabled
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
              }`}
            >
              {store.settings.privacyLockEnabled ? '关闭' : '开启'}
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <RefreshCw size={20} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-600">重置所有数据</div>
              <div className="text-xs text-slate-500 mt-0.5">清空所有账单和设置，恢复默认</div>
            </div>
          </button>
        </div>

        <div className="text-center text-xs text-slate-400 py-4">
          记账理财 · 纯前端本地存储 · 数据安全
        </div>
      </div>

      <Modal
        open={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
          setPasswordConfirm('');
        }}
        title="设置隐私锁密码"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="请再次输入密码"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
            />
          </div>

          {password && passwordConfirm && password !== passwordConfirm && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertTriangle size={14} />
              <span>两次输入的密码不一致</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
                setPasswordConfirm('');
              }}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSetPassword}
              disabled={!password || (password && password !== passwordConfirm)}
              className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认设置
            </button>
          </div>
        </div>
      </Modal>

      {activeSection === 'categories' && (
        <CategoriesSection onClose={() => setActiveSection(null)} />
      )}
      {activeSection === 'accounts' && (
        <AccountsSection onClose={() => setActiveSection(null)} />
      )}
      {activeSection === 'recurring' && (
        <RecurringSection onClose={() => setActiveSection(null)} />
      )}
    </div>
  );
};

interface SectionProps {
  onClose: () => void;
}

const CategoriesSection = ({ onClose }: SectionProps) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('MoreHorizontal');
  const [editColor, setEditColor] = useState('#6B7280');

  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const expenseCategories = categories.filter((c) => c.type === 'expense').sort((a, b) => a.sort - b.sort);
  const incomeCategories = categories.filter((c) => c.type === 'income').sort((a, b) => a.sort - b.sort);

  const openNew = (type: TransactionType) => {
    setIsNew(true);
    setEditingCategory(null);
    setEditType(type);
    setEditName('');
    setEditIcon('MoreHorizontal');
    setEditColor('#6B7280');
  };

  const openEdit = (cat: Category) => {
    setIsNew(false);
    setEditingCategory(cat);
    setEditType(cat.type);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditColor(cat.color);
  };

  const handleSave = () => {
    if (!editName.trim()) return;
    if (isNew) {
      addCategory({ name: editName.trim(), type: editType, icon: editIcon, color: editColor });
    } else if (editingCategory) {
      if (editingCategory.type !== editType) {
        if (!confirm(`切换分类类型后，已使用该分类的账单也会变为"${editType === 'income' ? '收入' : '支出'}"类型，确定继续吗？`)) {
          return;
        }
      }
      updateCategory(editingCategory.id, { name: editName.trim(), icon: editIcon, color: editColor, type: editType });
    }
    setEditingCategory(null);
    setIsNew(false);
  };

  const handleDelete = (cat: Category) => {
    if (confirm(`确定要删除分类"${cat.name}"吗？相关账单的分类将显示为未知。`)) {
      deleteCategory(cat.id);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="分类管理"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-slate-700">支出分类</h5>
            <button
              onClick={() => openNew('expense')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 text-xs font-medium hover:bg-teal-100 transition-colors"
            >
              <Plus size={14} />
              <span>新增</span>
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {expenseCategories.map((cat) => (
              <div
                key={cat.id}
                className="group flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <DynamicIcon name={cat.icon} size={16} />
                </div>
                <span className="text-sm text-slate-700 flex-1 truncate">{cat.name}</span>
                <button
                  onClick={() => openEdit(cat)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-600 transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-slate-700">收入分类</h5>
            <button
              onClick={() => openNew('income')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors"
            >
              <Plus size={14} />
              <span>新增</span>
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {incomeCategories.map((cat) => (
              <div
                key={cat.id}
                className="group flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <DynamicIcon name={cat.icon} size={16} />
                </div>
                <span className="text-sm text-slate-700 flex-1 truncate">{cat.name}</span>
                <button
                  onClick={() => openEdit(cat)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-600 transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(isNew || editingCategory) && (
        <Modal
          open={true}
          onClose={() => {
            setEditingCategory(null);
            setIsNew(false);
          }}
          title={isNew ? '新增分类' : '编辑分类'}
        >
          <div className="space-y-4">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setEditType('expense')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  editType === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-600'
                }`}
              >
                支出
              </button>
              <button
                onClick={() => setEditType('income')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  editType === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-600'
                }`}
              >
                收入
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="分类名称"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">图标</label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setEditIcon(icon)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                      editIcon === icon
                        ? 'bg-teal-500 text-white shadow-md scale-105'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <DynamicIcon name={icon} size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">颜色</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={`w-9 h-9 rounded-xl transition-all ${
                      editColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsNew(false);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

const AccountsSection = ({ onClose }: SectionProps) => {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Wallet');
  const [editColor, setEditColor] = useState('#6B7280');
  const [editType, setEditType] = useState<'cash' | 'bank' | 'wechat' | 'alipay' | 'other'>('cash');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(todayStr());
  const [transferNote, setTransferNote] = useState('');

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAccountId, setAdjustAccountId] = useState('');
  const [adjustNewBalance, setAdjustNewBalance] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyAccountId, setHistoryAccountId] = useState<string | null>(null);

  const allAccounts = useStore((s) => s.accounts);
  const allTransactions = useStore((s) => s.transactions);
  const currency = useStore((s) => s.settings.currency);
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const transferBetweenAccounts = useStore((s) => s.transferBetweenAccounts);
  const adjustAccountBalance = useStore((s) => s.adjustAccountBalance);

  const accounts = useMemo(
    () => [...allAccounts].sort((a, b) => a.sort - b.sort),
    [allAccounts]
  );

  const accountHistory = useMemo(() => {
    if (!historyAccountId) return [];
    return allTransactions
      .filter((t) =>
        (t.type === 'adjustment' && t.accountId === historyAccountId) ||
        (t.type === 'transfer' && (t.accountId === historyAccountId || t.toAccountId === historyAccountId))
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [allTransactions, historyAccountId]);

  const openNew = () => {
    setIsNew(true);
    setEditingAccount(null);
    setEditName('');
    setEditIcon('Wallet');
    setEditColor('#6B7280');
    setEditType('other');
  };

  const openEdit = (acc: Account) => {
    setIsNew(false);
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditIcon(acc.icon);
    setEditColor(acc.color);
    setEditType(acc.type);
  };

  const handleSave = () => {
    if (!editName.trim()) return;
    if (isNew) {
      addAccount({ name: editName.trim(), type: editType, icon: editIcon, color: editColor });
    } else if (editingAccount) {
      updateAccount(editingAccount.id, { name: editName.trim(), icon: editIcon, color: editColor, type: editType });
    }
    setEditingAccount(null);
    setIsNew(false);
  };

  const handleDelete = (acc: Account) => {
    if (confirm(`确定要删除账户"${acc.name}"吗？相关账单的账户将显示为未知。`)) {
      deleteAccount(acc.id);
    }
  };

  const openTransfer = (fromAccountId?: string) => {
    setTransferFromId(fromAccountId || accounts[0]?.id || '');
    const otherAccounts = accounts.filter((a) => a.id !== transferFromId);
    setTransferToId(otherAccounts[0]?.id || '');
    setTransferAmount('');
    setTransferDate(todayStr());
    setTransferNote('');
    setShowTransferModal(true);
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!transferFromId || !transferToId || !amount || amount <= 0) return;
    if (transferFromId === transferToId) {
      alert('转出和转入账户不能相同');
      return;
    }
    transferBetweenAccounts(transferFromId, transferToId, amount, transferDate, transferNote);
    setShowTransferModal(false);
  };

  const openAdjust = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;
    setAdjustAccountId(accountId);
    setAdjustNewBalance(acc.balance.toString());
    setAdjustNote('');
    setShowAdjustModal(true);
  };

  const handleAdjust = () => {
    const newBalance = parseFloat(adjustNewBalance);
    if (!adjustAccountId || isNaN(newBalance)) return;
    adjustAccountBalance(adjustAccountId, newBalance, adjustNote);
    setShowAdjustModal(false);
  };

  const openHistory = (accountId: string) => {
    setHistoryAccountId(accountId);
    setShowHistoryModal(true);
  };

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || '未知账户';
  const historyAccount = historyAccountId ? accounts.find((a) => a.id === historyAccountId) : null;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="账户管理"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => openTransfer()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
          >
            <ArrowRightLeft size={16} />
            <span>账户转账</span>
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
          >
            <Plus size={16} />
            <span>新增账户</span>
          </button>
        </div>

        <div className="space-y-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                >
                  <DynamicIcon name={acc.icon} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{acc.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    余额: <span className={acc.balance >= 0 ? 'text-slate-700 font-medium' : 'text-red-500 font-medium'}>{formatMoney(acc.balance, currency)}</span>
                  </div>
                </div>
                <button
                  onClick={() => openHistory(acc.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
                  title="调整记录"
                >
                  <History size={18} />
                </button>
                <button
                  onClick={() => openAdjust(acc.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                  title="余额校准"
                >
                  <Scale size={18} />
                </button>
                <button
                  onClick={() => openTransfer(acc.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="转出"
                >
                  <ArrowRightLeft size={18} />
                </button>
                <button
                  onClick={() => openEdit(acc)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
                  title="编辑"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(acc)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(isNew || editingAccount) && (
        <Modal
          open={true}
          onClose={() => {
            setEditingAccount(null);
            setIsNew(false);
          }}
          title={isNew ? '新增账户' : '编辑账户'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">账户类型</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as Account['type'])}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              >
                <option value="cash">现金</option>
                <option value="bank">银行卡</option>
                <option value="wechat">微信</option>
                <option value="alipay">支付宝</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="账户名称"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">图标</label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setEditIcon(icon)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                      editIcon === icon
                        ? 'bg-teal-500 text-white shadow-md scale-105'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <DynamicIcon name={icon} size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">颜色</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={`w-9 h-9 rounded-xl transition-all ${
                      editColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setIsNew(false);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showTransferModal && (
        <Modal
          open={true}
          onClose={() => setShowTransferModal(false)}
          title="账户转账"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">转出账户</label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
                >
                  <option value="">请选择</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.balance, currency)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">转入账户</label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
                >
                  <option value="">请选择</option>
                  {accounts
                    .filter((a) => a.id !== transferFromId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatMoney(a.balance, currency)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">转账金额</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50">
                <span className="text-slate-500">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-lg font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">日期</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">备注</label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="可选，如：取现、还款等"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              />
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
              转账不会产生收入或支出，仅调整两个账户的余额和净资产。
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTransfer}
                disabled={!transferFromId || !transferToId || !transferAmount || parseFloat(transferAmount) <= 0 || transferFromId === transferToId}
                className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认转账
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAdjustModal && (
        <Modal
          open={true}
          onClose={() => setShowAdjustModal(false)}
          title="余额校准"
        >
          <div className="space-y-4">
            {(() => {
              const acc = accounts.find((a) => a.id === adjustAccountId);
              if (!acc) return null;
              const newBal = parseFloat(adjustNewBalance);
              const diff = isNaN(newBal) ? 0 : newBal - acc.balance;
              return (
                <>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                      >
                        <DynamicIcon name={acc.icon} size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{acc.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          当前余额: <span className="font-medium text-slate-700">{formatMoney(acc.balance, currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">校准后余额</label>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50">
                      <span className="text-slate-500">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={adjustNewBalance}
                        onChange={(e) => setAdjustNewBalance(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-lg font-bold outline-none"
                      />
                    </div>
                  </div>

                  {!isNaN(newBal) && diff !== 0 && (
                    <div className={`text-sm rounded-xl p-3 ${diff > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      差额: {diff > 0 ? '+' : ''}{formatMoney(diff, currency)}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">调整原因（可选）</label>
                    <input
                      type="text"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                      placeholder="如：银行月结、现金盘点等"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
                    />
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                    校准会生成一条调整记录，方便以后追溯余额变化原因。
                  </div>
                </>
              );
            })()}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdjust}
                disabled={!adjustAccountId || adjustNewBalance === '' || isNaN(parseFloat(adjustNewBalance))}
                className="flex-1 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认校准
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showHistoryModal && historyAccount && (
        <Modal
          open={true}
          onClose={() => {
            setShowHistoryModal(false);
            setHistoryAccountId(null);
          }}
          title={`${historyAccount.name} - 调整记录`}
        >
          <div className="space-y-3">
            {accountHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <History size={36} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无调整记录</p>
                <p className="text-xs mt-1">余额校准和账户转账都会在这里显示</p>
              </div>
            ) : (
              accountHistory.map((t) => {
                if (t.type === 'transfer') {
                  const isOut = t.accountId === historyAccountId;
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <ArrowRightLeft size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">
                          {isOut ? `转出至 ${getAccountName(t.toAccountId || '')}` : `从 ${getAccountName(t.accountId)} 转入`}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatDateCN(t.date)}
                          {t.note && t.note !== '账户转账' ? ` · ${t.note}` : ''}
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${isOut ? 'text-slate-700' : 'text-emerald-600'}`}>
                        {isOut ? '-' : '+'}{formatMoney(t.amount, currency)}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                      <Scale size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">余额校准</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDateCN(t.date)}
                        {t.note ? ` · ${t.note}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Modal>
      )}
    </Modal>
  );
};

const RecurringSection = ({ onClose }: SectionProps) => {
  const [editingRecurring, setEditingRecurring] = useState<Recurring | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allRecurring = useStore((s) => s.recurring);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const currency = useStore((s) => s.settings.currency);
  const addRecurring = useStore((s) => s.addRecurring);
  const updateRecurring = useStore((s) => s.updateRecurring);
  const deleteRecurring = useStore((s) => s.deleteRecurring);
  const skipRecurringNext = useStore((s) => s.skipRecurringNext);
  const recordRecurringNow = useStore((s) => s.recordRecurringNow);

  const recurring = useMemo(
    () => [...allRecurring].sort((a, b) => a.nextDate.localeCompare(b.nextDate)),
    [allRecurring]
  );

  const openNew = () => {
    setIsNew(true);
    setEditingRecurring({
      id: '',
      type: 'expense',
      amount: 0,
      categoryId: '',
      accountId: '',
      frequency: 'monthly',
      startDate: todayStr(),
      nextDate: todayStr(),
      note: '',
      active: true,
    });
  };

  const openEdit = (r: Recurring) => {
    setIsNew(false);
    setEditingRecurring(r);
  };

  const handleSave = () => {
    if (!editingRecurring) return;
    if (editingRecurring.amount <= 0 || !editingRecurring.categoryId || !editingRecurring.accountId) return;

    if (isNew) {
      addRecurring({
        type: editingRecurring.type,
        amount: editingRecurring.amount,
        categoryId: editingRecurring.categoryId,
        accountId: editingRecurring.accountId,
        frequency: editingRecurring.frequency,
        startDate: editingRecurring.startDate,
        note: editingRecurring.note,
        active: editingRecurring.active,
      });
    } else {
      updateRecurring(editingRecurring.id, editingRecurring);
    }
    setEditingRecurring(null);
    setIsNew(false);
  };

  const handleDelete = (r: Recurring) => {
    if (confirm(`确定要删除这条周期账单吗？`)) {
      deleteRecurring(r.id);
    }
  };

  const frequencyLabels: Record<Frequency, string> = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年',
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="周期账单"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
          >
            <Plus size={16} />
            <span>新增周期账单</span>
          </button>
        </div>

        {recurring.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCcw size={36} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无周期账单</p>
            <p className="text-xs mt-1">设置定期自动记账，如房租、工资等</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recurring.map((r) => {
              const cat = categories.find((c) => c.id === r.categoryId);
              const acc = accounts.find((a) => a.id === r.accountId);
              const isExpanded = expandedId === r.id;
              const upcoming = getUpcomingDates(r.nextDate, r.frequency, 5);
              return (
                <div
                  key={r.id}
                  className="rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden"
                >
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat?.color || '#6B7280'}20`, color: cat?.color || '#6B7280' }}
                      >
                        <DynamicIcon name={cat?.icon || 'MoreHorizontal'} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{cat?.name || '未知'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            r.active ? 'bg-teal-50 text-teal-600' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {r.active ? '启用' : '停用'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {frequencyLabels[r.frequency]} · {acc?.name || '未知账户'}
                          {r.note && ` · ${r.note}`}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar size={12} />
                          下次: {formatDateCN(r.nextDate)}
                          <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base font-bold ${r.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {r.type === 'income' ? '+' : '-'}{formatMoney(r.amount, currency)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-200/60 pt-3 space-y-3">
                      <div>
                        <div className="text-xs text-slate-500 mb-1.5 font-medium">未来 {upcoming.length} 次预计</div>
                        <div className="flex flex-wrap gap-1.5">
                          {upcoming.map((d, i) => (
                            <span
                              key={d}
                              className={`text-xs px-2.5 py-1 rounded-full ${
                                i === 0 ? 'bg-teal-100 text-teal-700 font-medium' : 'bg-white text-slate-600'
                              }`}
                            >
                              {formatDateCN(d)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); recordRecurringNow(r.id); }}
                          disabled={!r.active}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Zap size={13} />
                          <span>立即记一笔</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); skipRecurringNext(r.id); }}
                          disabled={!r.active}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <SkipForward size={13} />
                          <span>跳过本期</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateRecurring(r.id, { active: !r.active }); }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            r.active ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-teal-500 text-white hover:bg-teal-600'
                          }`}
                        >
                          <Check size={13} />
                          <span>{r.active ? '暂停' : '启用'}</span>
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(isNew || editingRecurring) && editingRecurring && (
        <Modal
          open={true}
          onClose={() => {
            setEditingRecurring(null);
            setIsNew(false);
          }}
          title={isNew ? '新增周期账单' : '编辑周期账单'}
        >
          <div className="space-y-4">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setEditingRecurring({ ...editingRecurring, type: 'expense' })}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  editingRecurring.type === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-600'
                }`}
              >
                支出
              </button>
              <button
                onClick={() => setEditingRecurring({ ...editingRecurring, type: 'income' })}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  editingRecurring.type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-600'
                }`}
              >
                收入
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">金额</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50">
                <span className="text-slate-500">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingRecurring.amount || ''}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, amount: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-transparent text-lg font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
              <select
                value={editingRecurring.categoryId}
                onChange={(e) => setEditingRecurring({ ...editingRecurring, categoryId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              >
                <option value="">请选择分类</option>
                {categories
                  .filter((c) => c.type === editingRecurring.type)
                  .sort((a, b) => a.sort - b.sort)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">账户</label>
              <select
                value={editingRecurring.accountId}
                onChange={(e) => setEditingRecurring({ ...editingRecurring, accountId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              >
                <option value="">请选择账户</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">频率</label>
              <select
                value={editingRecurring.frequency}
                onChange={(e) => setEditingRecurring({ ...editingRecurring, frequency: e.target.value as Frequency })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              >
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">开始日期</label>
              <input
                type="date"
                value={editingRecurring.startDate}
                onChange={(e) => setEditingRecurring({ ...editingRecurring, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">备注</label>
              <input
                type="text"
                value={editingRecurring.note}
                onChange={(e) => setEditingRecurring({ ...editingRecurring, note: e.target.value })}
                placeholder="添加备注..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-sm outline-none focus:bg-slate-100"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setEditingRecurring(null);
                  setIsNew(false);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={editingRecurring.amount <= 0 || !editingRecurring.categoryId || !editingRecurring.accountId}
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
