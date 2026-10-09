// src/utils/csvParser.js
import Papa from 'papaparse';

const CATEGORY_RULES = [
  { keywords: ['swiggy', 'zomato', 'mcdonalds', 'mcdonald', 'burger', 'restaurant', 'blinkit', 'zepto', 'cafe', 'coffee', 'pizza', 'food', 'starbucks', 'dominos', 'kfc', 'subway', 'dining'], category: 'food' },
  { keywords: ['uber', 'ola', 'metro', 'petrol', 'fuel', 'cab', 'bus', 'train', 'rapido', 'auto', 'auto-rickshaw', 'rickshaw', 'bharat petroleum', 'ioc', 'hpcl'], category: 'transport' },
  { keywords: ['rent', 'landlord', 'housing', 'flat', 'apartment', 'pg ', 'pg,'], category: 'rent' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'shopping', 'purchase', 'meesho', 'nykaa', 'ajio', 'reliance', 'mall', 'store', 'market'], category: 'shopping' },
  { keywords: ['netflix', 'spotify', 'prime', 'youtube', 'hotstar', 'zee5', 'subscription', 'plan'], category: 'subscriptions' },
  { keywords: ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'recharge', 'bill', 'mseb', 'airtel', 'jio', 'vi ', 'bsnl', 'municipal', 'utility'], category: 'utilities' },
  { keywords: ['salary', 'credit', 'income', 'bonus', 'payment received', 'transfer received'], category: 'income' },
];

export function categorizeTransaction(description) {
  if (!description) return 'uncategorized';
  const lower = description.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.category;
    }
  }
  return 'uncategorized';
}

export function validateCSVRow(row, index) {
  const errors = [];

  // Date validation
  if (!row.date) {
    errors.push(`Row ${index + 1}: Missing date`);
  } else {
    const d = new Date(row.date);
    if (isNaN(d.getTime())) {
      errors.push(`Row ${index + 1}: Invalid date "${row.date}"`);
    }
  }

  // Amount validation
  if (row.amount === undefined || row.amount === null || row.amount === '') {
    errors.push(`Row ${index + 1}: Missing amount`);
  } else {
    const amt = parseFloat(String(row.amount).replace(/[₹,\s]/g, ''));
    if (isNaN(amt)) {
      errors.push(`Row ${index + 1}: Invalid amount "${row.amount}"`);
    }
  }

  // Description
  if (!row.description) {
    errors.push(`Row ${index + 1}: Missing description`);
  }

  return errors;
}

/**
 * Parse a CSV file/text and return structured transaction data.
 * @param {string} csvText
 * @returns {{ valid: Array, invalid: Array, errors: Array }}
 */
export function parseCSV(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  const valid = [];
  const invalid = [];
  const allErrors = [];

  result.data.forEach((row, index) => {
    // Normalize column names
    const normalized = {
      date: row.date || row.Date || row.DATE || '',
      description: row.description || row.Description || row.DESCRIPTION || row.narration || row.details || '',
      amount: row.amount || row.Amount || row.AMOUNT || row.debit || row.credit || '',
    };

    const errors = validateCSVRow(normalized, index);

    if (errors.length > 0) {
      allErrors.push(...errors);
      invalid.push({ ...normalized, errors });
    } else {
      const rawAmount = parseFloat(String(normalized.amount).replace(/[₹,\s]/g, ''));
      const category = categorizeTransaction(normalized.description);
      const type = rawAmount >= 0 ? 'income' : 'expense';

      valid.push({
        date: normalized.date.trim(),
        description: normalized.description.trim(),
        amount: rawAmount,
        category: type === 'income' ? 'income' : category,
        type,
      });
    }
  });

  return { valid, invalid, errors: allErrors };
}
