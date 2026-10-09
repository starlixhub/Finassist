// src/utils/formatters.js

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

export const formatCurrencySigned = (amount, currency = 'INR') => {
  const abs = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return amount < 0 ? `-${abs}` : `+${abs}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
};

export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export const formatPercent = (value, total) => {
  if (!total || total === 0) return '0%';
  return ((Math.abs(value) / Math.abs(total)) * 100).toFixed(1) + '%';
};

export const formatPercentValue = (value) => {
  return value.toFixed(1) + '%';
};

export const formatMonthLabel = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

export const categoryColors = {
  rent:          '#0B6E6E',
  food:          '#F59E0B',
  transport:     '#3B82F6',
  shopping:      '#8B5CF6',
  subscriptions: '#EC4899',
  utilities:     '#6B7280',
  uncategorized: '#9CA3AF',
  income:        '#07704A',
};

export const categoryLabels = {
  rent:          'Rent',
  food:          'Food & Dining',
  transport:     'Transport',
  shopping:      'Shopping',
  subscriptions: 'Subscriptions',
  utilities:     'Utilities',
  uncategorized: 'Uncategorized',
  income:        'Income',
};

export const categoryIcons = {
  rent:          '🏠',
  food:          '🍽️',
  transport:     '🚗',
  shopping:      '🛍️',
  subscriptions: '📱',
  utilities:     '⚡',
  uncategorized: '📦',
  income:        '💰',
};
