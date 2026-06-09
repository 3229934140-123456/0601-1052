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

export const BottomNav = () => {
  const privacyLockEnabled = useStore((s) => s.settings.privacyLockEnabled);
  const lock = useStore((s) => s.lock);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-3 min-h-[56px] flex-1 transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400'
              }`
            }
          >
            <item.icon size={22} strokeWidth={2} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
        {privacyLockEnabled && (
          <button
            onClick={lock}
            className="flex flex-col items-center justify-center py-2 px-3 min-h-[56px] flex-1 transition-colors text-slate-400 hover:text-red-500"
            title="锁定应用"
          >
            <Lock size={22} strokeWidth={2} />
            <span className="text-[10px] mt-1 font-medium">锁定</span>
          </button>
        )}
      </div>
    </nav>
  );
};
