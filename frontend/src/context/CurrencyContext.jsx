// src/context/CurrencyContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CURRENCY_CONFIG,
  getActiveCurrency,
  setActiveCurrency,
  formatCurrency as formatCurr,
  formatCurrencySigned as formatCurrSigned,
  convertAmount as convAmt,
  getCurrencySymbol as getSymbol,
} from '../utils/formatters';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => getActiveCurrency());

  const handleSetCurrency = (newCurrency) => {
    if (!CURRENCY_CONFIG[newCurrency]) return;
    setCurrencyState(newCurrency);
    setActiveCurrency(newCurrency);
  };

  useEffect(() => {
    const handleCurrencyEvent = (e) => {
      const next = e.detail?.currency;
      if (next && next !== currency && CURRENCY_CONFIG[next]) {
        setCurrencyState(next);
      }
    };
    window.addEventListener('finassist:currency_change', handleCurrencyEvent);
    return () => window.removeEventListener('finassist:currency_change', handleCurrencyEvent);
  }, [currency]);

  const value = {
    currency,
    setCurrency: handleSetCurrency,
    format: (amount) => formatCurr(amount, currency),
    formatSigned: (amount) => formatCurrSigned(amount, currency),
    convert: (amount) => convAmt(amount, currency),
    symbol: getSymbol(currency),
    config: CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR,
    allCurrencies: CURRENCY_CONFIG,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    const curr = getActiveCurrency();
    return {
      currency: curr,
      setCurrency: (newCurr) => setActiveCurrency(newCurr),
      format: (amount) => formatCurr(amount, curr),
      formatSigned: (amount) => formatCurrSigned(amount, curr),
      convert: (amount) => convAmt(amount, curr),
      symbol: getSymbol(curr),
      config: CURRENCY_CONFIG[curr] || CURRENCY_CONFIG.INR,
      allCurrencies: CURRENCY_CONFIG,
    };
  }
  return ctx;
}
