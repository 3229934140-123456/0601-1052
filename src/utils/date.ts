import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Frequency } from '@/types';

export const formatDate = (date: string | Date, fmt: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
};

export const formatDateCN = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy年M月d日', { locale: zhCN });
};

export const formatMonthCN = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy年M月', { locale: zhCN });
};

export const formatMonth = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM');
};

export const todayStr = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const currentMonthStr = (): string => {
  return format(new Date(), 'yyyy-MM');
};

export const getMonthDays = (yearMonth: string): Date[] => {
  const [year, month] = yearMonth.split('-').map(Number);
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end });
};

export const getRecentMonths = (count: number): string[] => {
  const result: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    result.push(format(subMonths(now, i), 'yyyy-MM'));
  }
  return result;
};

export const getNextDate = (date: string, frequency: Frequency): string => {
  const d = parseISO(date);
  let next: Date;
  switch (frequency) {
    case 'daily':
      next = addDays(d, 1);
      break;
    case 'weekly':
      next = addWeeks(d, 1);
      break;
    case 'monthly':
      next = addMonths(d, 1);
      break;
    case 'yearly':
      next = addYears(d, 1);
      break;
  }
  return format(next, 'yyyy-MM-dd');
};
