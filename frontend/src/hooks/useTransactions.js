// src/hooks/useTransactions.js
import { useState, useCallback, useEffect } from 'react';
import { getTransactions, addTransactions } from '../data/mockData';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setTransactions(getTransactions());
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const importTransactions = useCallback((newTxns) => {
    const updated = addTransactions(newTxns);
    setTransactions(updated);
    return updated;
  }, []);

  return { transactions, loading, refresh, importTransactions };
}
