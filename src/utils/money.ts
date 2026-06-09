export const formatMoney = (amount: number, currency: string = '¥'): string => {
  const formatted = Math.abs(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
};

export const formatMoneyWithSign = (amount: number, currency: string = '¥'): string => {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}${formatMoney(Math.abs(amount), currency)}`;
};

export const formatMoneyCompact = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return amount.toFixed(0);
};
