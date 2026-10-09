// src/utils/calculations.js

/**
 * Get all transactions for a specific month/year.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month - 1-indexed
 */
export function getMonthTransactions(transactions, year, month) {
  return transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export function getMonthlyExpenses(transactions, year, month) {
  const txns = getMonthTransactions(transactions, year, month);
  return txns
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function getMonthlyIncome(transactions, year, month, fallbackIncome = 0) {
  const txns = getMonthTransactions(transactions, year, month);
  const txnIncome = txns
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  return txnIncome > 0 ? txnIncome : fallbackIncome;
}

export function getCategoryBreakdown(transactions, year, month) {
  const txns = getMonthTransactions(transactions, year, month)
    .filter(t => t.type === 'expense');

  const map = {};
  txns.forEach(t => {
    const cat = t.category || 'uncategorized';
    map[cat] = (map[cat] || 0) + Math.abs(t.amount);
  });

  return Object.entries(map).map(([category, amount]) => ({ category, amount }));
}

export function getNetCashFlow(transactions, year, month, fallbackIncome = 0) {
  const income = getMonthlyIncome(transactions, year, month, fallbackIncome);
  const expenses = getMonthlyExpenses(transactions, year, month);
  return income - expenses;
}

export function getSavingsRate(transactions, year, month, fallbackIncome = 0) {
  const income = getMonthlyIncome(transactions, year, month, fallbackIncome);
  const net = getNetCashFlow(transactions, year, month, fallbackIncome);
  if (!income) return 0;
  return (net / income) * 100;
}

/**
 * Detect the biggest anomaly — transaction with highest deviation from category average.
 */
export function detectAnomaly(transactions) {
  // Build category averages excluding this transaction
  const expTxns = transactions.filter(t => t.type === 'expense');

  const catSums = {};
  const catCounts = {};
  expTxns.forEach(t => {
    const cat = t.category;
    catSums[cat] = (catSums[cat] || 0) + Math.abs(t.amount);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  let maxDeviation = 0;
  let anomaly = null;

  expTxns.forEach(t => {
    const cat = t.category;
    const count = catCounts[cat];
    if (count < 2) return; // Need at least 2 transactions to find anomaly
    const totalExcl = catSums[cat] - Math.abs(t.amount);
    const avgExcl = totalExcl / (count - 1);
    if (avgExcl === 0) return;
    const deviation = ((Math.abs(t.amount) - avgExcl) / avgExcl) * 100;
    if (deviation > maxDeviation) {
      maxDeviation = deviation;
      anomaly = { transaction: t, deviation: deviation, avgExcl };
    }
  });

  return anomaly;
}

/**
 * Get spending trend for the last N months from a reference date.
 */
export function getSpendingTrend(transactions, months = 3, fallbackIncome = 75000) {
  const now = new Date('2026-10-25T00:00:00'); // Use demo data date
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const income = getMonthlyIncome(transactions, year, month, fallbackIncome);
    const expenses = getMonthlyExpenses(transactions, year, month);
    result.push({
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      monthYear: `${year}-${String(month).padStart(2, '0')}`,
      income,
      expenses,
      net: income - expenses,
    });
  }

  return result;
}

/**
 * Calculate budget usage for current month (Oct 2026).
 */
export function getBudgetUsage(transactions, budgets, year = 2026, month = 10) {
  const breakdown = getCategoryBreakdown(transactions, year, month);
  const spendMap = {};
  breakdown.forEach(b => { spendMap[b.category] = b.amount; });

  return budgets.map(budget => ({
    ...budget,
    spent: spendMap[budget.category] || 0,
    remaining: budget.limit - (spendMap[budget.category] || 0),
    usagePct: ((spendMap[budget.category] || 0) / budget.limit) * 100,
  }));
}

/**
 * Monthly summary for reports.
 */
export function getMonthlySummary(transactions, fallbackIncome = 75000) {
  const months = [
    { year: 2026, month: 8, label: 'Aug 2026' },
    { year: 2026, month: 9, label: 'Sep 2026' },
    { year: 2026, month: 10, label: 'Oct 2026' },
  ];

  return months.map(({ year, month, label }) => {
    const income = getMonthlyIncome(transactions, year, month, fallbackIncome);
    const expenses = getMonthlyExpenses(transactions, year, month);
    const net = income - expenses;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    return { label, year, month, income, expenses, net, savingsRate };
  });
}
