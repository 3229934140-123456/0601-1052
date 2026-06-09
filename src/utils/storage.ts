import type { AppData } from '@/types';

const STORAGE_KEY = 'finance-tracker-data';

export const loadFromStorage = (): AppData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as AppData;
    }
    return null;
  } catch (e) {
    console.error('Failed to load from storage:', e);
    return null;
  }
};

export const saveToStorage = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
};
