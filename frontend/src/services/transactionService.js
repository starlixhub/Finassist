// src/services/transactionService.js
import { getTransactions, addTransactions } from '../data/mockData';
import { parseCSV } from '../utils/csvParser';
import apiService from './apiService';

export const transactionService = {
  getAll() {
    return getTransactions();
  },

  importFromCSV(csvText) {
    const { valid, invalid, categories } = parseCSV(csvText);
    if (valid.length > 0) {
      addTransactions(valid);
    }
    return { valid, invalid, categories };
  },

  addBatch(transactions) {
    return addTransactions(transactions);
  },

  // Future backend upload bridge
  async uploadToBackend(file, userId = 1) {
    return apiService.uploadTransactionsCsv(file, userId);
  },
};

export default transactionService;
