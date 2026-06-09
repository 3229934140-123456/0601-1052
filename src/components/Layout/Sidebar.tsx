import { NavLink } from 'react-router-dom';
import { Plus, BookOpen, Target, BarChart3, Settings, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { path: '/record', label: '记一笔', icon: Plus },
  { path: '/ledger', label: '账本', icon: BookOpen },
  { path: '/budget', label: '预算', icon: Target },
  { path: '/statistics', label: '统计', icon: BarChart3 },
  { path: '/settings', label: '设置', icon: Settings },
];

export const Sidebar = () => {
  const { settings, lock } = useStore();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-slate-200 sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">账</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">记账理财</h1>
            <p className="text-xs text-slate-400">Personal Finance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {settings.privacyLockEnabled && (
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={lock}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium"
          >
            <Lock size={18} />
            <span>锁定应用</span>
          </button>
        </div>
      )}
    </aside>
  );
};
