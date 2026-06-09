import { useState, useMemo } from 'react';
import { Calendar, FileText, Camera, X, CheckCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DynamicIcon } from '@/components/DynamicIcon';
import { todayStr, formatDateCN } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { imageToBase64 } from '@/utils/export';
import type { TransactionType } from '@/types';

export const Record = () => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [success, setSuccess] = useState(false);

  const allCategories = useStore((s) => s.categories);
  const allAccounts = useStore((s) => s.accounts);
  const currency = useStore((s) => s.settings.currency);
  const addTransaction = useStore((s) => s.addTransaction);

  const categories = useMemo(
    () => allCategories.filter((c) => c.type === type).sort((a, b) => a.sort - b.sort),
    [allCategories, type]
  );
  const accounts = useMemo(
    () => [...allAccounts].sort((a, b) => a.sort - b.sort),
    [allAccounts]
  );

  const handleAmountInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await imageToBase64(file);
        setImage(base64);
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!categoryId || !accountId) return;

    addTransaction({
      type,
      amount: numAmount,
      categoryId,
      accountId,
      date,
      note,
      image,
    });

    setAmount('');
    setCategoryId('');
    setNote('');
    setImage(undefined);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1500);
  };

  const canSubmit = parseFloat(amount) > 0 && categoryId && accountId;

  return (
    <div className="min-h-screen">
      <div
        className={`relative h-48 md:h-56 rounded-b-[2rem] overflow-hidden ${
          type === 'expense'
            ? 'bg-gradient-to-br from-rose-500 via-red-500 to-orange-500'
            : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        <div className="relative h-full flex flex-col justify-end px-6 pb-6">
          <div className="inline-flex p-1 bg-white/20 backdrop-blur rounded-2xl mb-6 w-fit self-start">
            <button
              onClick={() => {
                const newType: TransactionType = 'expense';
                const expenseCats = allCategories.filter((c) => c.type === newType);
                const currentValid = expenseCats.some((c) => c.id === categoryId);
                setType(newType);
                if (!currentValid) setCategoryId('');
              }}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-white text-red-600 shadow-md'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              支出
            </button>
            <button
              onClick={() => {
                const newType: TransactionType = 'income';
                const incomeCats = allCategories.filter((c) => c.type === newType);
                const currentValid = incomeCats.some((c) => c.id === categoryId);
                setType(newType);
                if (!currentValid) setCategoryId('');
              }}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              收入
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-white/80 text-2xl font-medium">{currency}</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountInput(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-white text-5xl md:text-6xl font-bold placeholder-white/50 outline-none"
            />
          </div>
        </div>

        {success && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm animate-in fade-in">
            <div className="flex items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-2xl">
              <CheckCircle size={28} className="text-emerald-500" />
              <span className="text-lg font-semibold text-slate-800">记账成功</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 -mt-4 space-y-4 pb-28 lg:pb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-700">选择分类</span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  categoryId === cat.id
                    ? 'bg-teal-50 ring-2 ring-teal-500 shadow-md scale-105'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <DynamicIcon name={cat.icon} size={22} />
                </div>
                <span className="text-xs font-medium text-slate-700">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-700">选择账户</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setAccountId(acc.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  accountId === acc.id
                    ? 'bg-teal-50 ring-2 ring-teal-500 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                >
                  <DynamicIcon name={acc.icon} size={20} />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{acc.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatMoney(acc.balance, currency)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Calendar size={20} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{formatDateCN(date)}</span>
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="hidden"
              id="date-input"
            />
            {showDatePicker && (
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setShowDatePicker(false);
                }}
                className="px-4 py-3 rounded-xl bg-slate-50 border-none text-sm font-medium text-slate-700 outline-none"
                autoFocus
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <FileText size={20} className="text-slate-500 shrink-0" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 text-sm text-slate-700 placeholder-slate-400 outline-none focus:bg-slate-100 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
              <Camera size={20} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">添加凭证</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {image && (
              <div className="relative">
                <img src={image} alt="凭证" className="w-16 h-16 rounded-xl object-cover" />
                <button
                  onClick={() => setImage(undefined)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
            canSubmit
              ? type === 'expense'
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-rose-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          确认记账
        </button>
      </div>
    </div>
  );
};
