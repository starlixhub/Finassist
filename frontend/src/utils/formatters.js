// src/utils/formatters.js

export const CURRENCY_CONFIG = {
  INR: {
    code: 'INR',
    symbol: '₹',
    flag: '🇮🇳',
    label: 'INR (₹) - Indian Rupee',
    shortLabel: '₹ INR',
    locale: 'en-IN',
    rateFromINR: 1,
    digits: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    label: 'USD ($) - US Dollar',
    shortLabel: '$ USD',
    locale: 'en-US',
    rateFromINR: 0.012, // 1 USD ≈ 83.33 INR
    digits: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    flag: '🇪🇺',
    label: 'EUR (€) - Euro',
    shortLabel: '€ EUR',
    locale: 'de-DE',
    rateFromINR: 0.011, // 1 EUR ≈ 90.91 INR
    digits: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    flag: '🇬🇧',
    label: 'GBP (£) - British Pound',
    shortLabel: '£ GBP',
    locale: 'en-GB',
    rateFromINR: 0.00943, // 1 GBP ≈ 106.05 INR
    digits: 2,
  },
};

export const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.00943,
};

export const getActiveCurrency = () => {
  try {
    const directCurr = localStorage.getItem('finassist_active_currency');
    if (directCurr && CURRENCY_CONFIG[directCurr]) return directCurr;
    const raw = localStorage.getItem('finassist_demo_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user?.currency && CURRENCY_CONFIG[parsed.user.currency]) {
        return parsed.user.currency;
      }
    }
  } catch {
    // fallback to INR
  }
  return 'INR';
};

export const setActiveCurrency = (currencyCode) => {
  if (!CURRENCY_CONFIG[currencyCode]) return;
  try {
    localStorage.setItem('finassist_active_currency', currencyCode);
    const raw = localStorage.getItem('finassist_demo_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user) {
        parsed.user.currency = currencyCode;
        localStorage.setItem('finassist_demo_data', JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('finassist:currency_change', { detail: { currency: currencyCode } }));
};

export const getCurrencySymbol = (currency = null) => {
  const code = currency || getActiveCurrency();
  return CURRENCY_CONFIG[code]?.symbol || '₹';
};

export const convertAmount = (amountInInr, targetCurrency = null) => {
  if (amountInInr === null || amountInInr === undefined || isNaN(amountInInr)) return 0;
  const curr = targetCurrency || getActiveCurrency();
  const rate = CURRENCY_CONFIG[curr]?.rateFromINR ?? 1;
  const converted = Number(amountInInr) * rate;
  return curr === 'INR' ? Math.round(converted) : Number(converted.toFixed(2));
};

export const formatConvertedAmount = (convertedAmount, currency = null) => {
  const curr = currency || getActiveCurrency();
  const config = CURRENCY_CONFIG[curr] || CURRENCY_CONFIG.INR;
  const abs = Math.abs(convertedAmount);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: curr === 'INR' ? 0 : (abs % 1 === 0 ? 0 : 2),
    maximumFractionDigits: curr === 'INR' ? 0 : 2,
  }).format(abs);
};

export const formatCurrency = (amountInInr, currency = null) => {
  if (amountInInr === null || amountInInr === undefined || isNaN(amountInInr)) return '';
  const curr = currency || getActiveCurrency();
  const converted = convertAmount(amountInInr, curr);
  return formatConvertedAmount(converted, curr);
};

export const formatCurrencySigned = (amountInInr, currency = null) => {
  if (amountInInr === null || amountInInr === undefined || isNaN(amountInInr)) return '';
  const curr = currency || getActiveCurrency();
  const formatted = formatCurrency(Math.abs(amountInInr), curr);
  return amountInInr < 0 ? `-${formatted}` : `+${formatted}`;
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

// FinAssist Category Colors harmonized with Brand Green and high-contrast Apple semantic charts
export const categoryColors = {
  rent:          '#4D7C0F', // Primary Forest Green (Core baseline)
  repairs:       '#B91C1C', // Amber-Red (Hardware & Emergency repair)
  food:          '#D97706', // Warm Amber (Dining/Groceries)
  transport:     '#2563EB', // Clear Royal Blue (Transit)
  shopping:      '#7C3AED', // Muted Violet (Lifestyle)
  subscriptions: '#DB2777', // Soft Berry Pink (Recurring services)
  utilities:     '#0D9488', // Teal-Slate (Household bills)
  uncategorized: '#64748B', // Neutral Slate
  income:        '#15803D', // Emerald Green (Cash inflow)
};

export const categoryLabels = {
  rent:          'Rent & Housing',
  repairs:       'Hardware & Repairs',
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
