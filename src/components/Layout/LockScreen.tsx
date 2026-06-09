import { useState } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export const LockScreen = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const unlock = useStore((s) => s.unlock);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlock(password)) {
      setPassword('');
      setError('');
    } else {
      setError('密码错误，请重试');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Lock size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">记账理财</h1>
          <p className="text-white/60 text-sm">请输入密码解锁应用</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-teal-400 text-center text-lg font-medium tracking-widest"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2"
          >
            <Unlock size={20} />
            <span>解锁</span>
          </button>
        </form>
      </div>
    </div>
  );
};
