import { DynamicIcon } from './DynamicIcon';
import type { Category, Account } from '@/types';

interface CategoryBadgeProps {
  category?: Category;
  account?: Account;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const CategoryBadge = ({
  category,
  account,
  size = 'md',
  showName = true,
}: CategoryBadgeProps) => {
  const data = category || account;
  if (!data) return null;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center`}
        style={{ backgroundColor: `${data.color}15` }}
      >
        <DynamicIcon name={data.icon} size={iconSizes[size]} className="" />
      </div>
      {showName && <span className="text-sm font-medium text-slate-700">{data.name}</span>}
    </div>
  );
};
