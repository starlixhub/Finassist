// src/data/mockData.js
// Persistent data layer using localStorage

const STORAGE_KEY = 'finassist_demo_data';

const DEFAULT_DATA = {
  user: {
    id: 1,
    name: 'Kartik Sharma',
    email: 'kartik@example.com',
    monthlyIncome: 75000,
    currency: 'INR',
    onboardingComplete: false,
  },
  transactions: [
    // Oct 2026
    { id: 1,  date: '2026-10-01', description: 'Landlord Rent Payment',           amount: -15000, category: 'rent',          type: 'expense' },
    { id: 2,  date: '2026-10-02', description: 'Swiggy Lunch Order',              amount: -340,   category: 'food',          type: 'expense' },
    { id: 3,  date: '2026-10-03', description: 'Uber Ride to Office',             amount: -220,   category: 'transport',     type: 'expense' },
    { id: 4,  date: '2026-10-04', description: 'Amazon Online Shopping',          amount: -1850,  category: 'shopping',      type: 'expense' },
    { id: 5,  date: '2026-10-05', description: 'Netflix Monthly Subscription',    amount: -649,   category: 'subscriptions', type: 'expense' },
    { id: 6,  date: '2026-10-06', description: 'Electricity Bill MSEB',           amount: -1420,  category: 'utilities',     type: 'expense' },
    { id: 7,  date: '2026-10-07', description: 'Zomato Dinner',                   amount: -580,   category: 'food',          type: 'expense' },
    { id: 8,  date: '2026-10-08', description: 'Petrol Pump Fuel Fill',           amount: -1200,  category: 'transport',     type: 'expense' },
    { id: 9,  date: '2026-10-09', description: 'Starbucks Coffee Cafe',           amount: -450,   category: 'food',          type: 'expense' },
    { id: 10, date: '2026-10-10', description: 'Flipkart Electronics Sale',       amount: -3200,  category: 'shopping',      type: 'expense' },
    { id: 11, date: '2026-10-11', description: 'Spotify Premium Plan',            amount: -119,   category: 'subscriptions', type: 'expense' },
    { id: 12, date: '2026-10-12', description: 'Airtel Broadband Recharge',       amount: -999,   category: 'utilities',     type: 'expense' },
    { id: 13, date: '2026-10-13', description: 'Ola Cabs Airport Travel',         amount: -650,   category: 'transport',     type: 'expense' },
    { id: 14, date: '2026-10-14', description: 'McDonalds Restaurant Burger Meal',amount: -420,   category: 'food',          type: 'expense' },
    { id: 15, date: '2026-10-15', description: 'Myntra Clothing Fashion Sale',    amount: -2450,  category: 'shopping',      type: 'expense' },
    { id: 16, date: '2026-10-16', description: 'Water Bill Municipal Corp',       amount: -350,   category: 'utilities',     type: 'expense' },
    { id: 17, date: '2026-10-17', description: 'Metro Rail Smart Card Recharge',  amount: -500,   category: 'transport',     type: 'expense' },
    { id: 18, date: '2026-10-18', description: 'Emergency Laptop Motherboard Repair', amount: -28500, category: 'uncategorized', type: 'expense' },
    { id: 19, date: '2026-10-19', description: 'Amazon Prime Video Annual',       amount: -1499,  category: 'subscriptions', type: 'expense' },
    { id: 20, date: '2026-10-20', description: 'Blinkit Groceries Quick Delivery',amount: -780,   category: 'food',          type: 'expense' },
    { id: 21, date: '2026-10-21', description: 'Jio Mobile Recharge',             amount: -299,   category: 'utilities',     type: 'expense' },
    { id: 22, date: '2026-10-22', description: 'Cafe Coffee Day Meeting',         amount: -380,   category: 'food',          type: 'expense' },
    { id: 23, date: '2026-10-23', description: 'Zepto Groceries Night Order',     amount: -460,   category: 'food',          type: 'expense' },
    { id: 24, date: '2026-10-24', description: 'Fuel Station Bharat Petroleum',   amount: -800,   category: 'transport',     type: 'expense' },
    { id: 25, date: '2026-10-25', description: 'Local Hardware Store Lock',       amount: -415,   category: 'uncategorized', type: 'expense' },
    // Sep 2026
    { id: 26, date: '2026-09-01', description: 'Salary Credit September',         amount: 75000,  category: 'income',        type: 'income'  },
    { id: 27, date: '2026-09-01', description: 'Landlord Rent Payment',           amount: -15000, category: 'rent',          type: 'expense' },
    { id: 28, date: '2026-09-05', description: 'Swiggy Multiple Orders',          amount: -1850,  category: 'food',          type: 'expense' },
    { id: 29, date: '2026-09-08', description: 'Ola Uber Rides',                  amount: -1100,  category: 'transport',     type: 'expense' },
    { id: 30, date: '2026-09-10', description: 'Amazon Shopping',                 amount: -4200,  category: 'shopping',      type: 'expense' },
    { id: 31, date: '2026-09-12', description: 'Electricity Water Bills',         amount: -1800,  category: 'utilities',     type: 'expense' },
    { id: 32, date: '2026-09-15', description: 'OTT Subscriptions Bundle',        amount: -1200,  category: 'subscriptions', type: 'expense' },
    { id: 33, date: '2026-09-20', description: 'Restaurant Dining Out',           amount: -2300,  category: 'food',          type: 'expense' },
    { id: 34, date: '2026-09-25', description: 'Petrol Fuel',                     amount: -1600,  category: 'transport',     type: 'expense' },
    // Aug 2026
    { id: 35, date: '2026-08-01', description: 'Salary Credit August',            amount: 75000,  category: 'income',        type: 'income'  },
    { id: 36, date: '2026-08-01', description: 'Landlord Rent Payment',           amount: -15000, category: 'rent',          type: 'expense' },
    { id: 37, date: '2026-08-07', description: 'Zomato Swiggy Food Orders',       amount: -2100,  category: 'food',          type: 'expense' },
    { id: 38, date: '2026-08-12', description: 'Metro Uber Commute',              amount: -950,   category: 'transport',     type: 'expense' },
    { id: 39, date: '2026-08-15', description: 'Flipkart Sale Purchase',          amount: -5800,  category: 'shopping',      type: 'expense' },
    { id: 40, date: '2026-08-18', description: 'Electricity Internet Bills',      amount: -2100,  category: 'utilities',     type: 'expense' },
    { id: 41, date: '2026-08-22', description: 'Streaming Services',              amount: -900,   category: 'subscriptions', type: 'expense' },
    { id: 42, date: '2026-08-28', description: 'Coffee Restaurants',              amount: -1400,  category: 'food',          type: 'expense' },
  ],
  savingsGoals: [
    {
      id: 1,
      name: 'Emergency Fund',
      targetAmount: 150000,
      savedAmount: 45000,
      targetDate: '2027-03-31',
      category: 'emergency',
      createdAt: '2026-08-01'
    },
    {
      id: 2,
      name: 'New Laptop',
      targetAmount: 80000,
      savedAmount: 20000,
      targetDate: '2027-01-31',
      category: 'electronics',
      createdAt: '2026-09-01'
    }
  ],
  budgets: [
    { id: 1, category: 'food',          limit: 8000,  period: 'monthly' },
    { id: 2, category: 'transport',     limit: 4000,  period: 'monthly' },
    { id: 3, category: 'shopping',      limit: 6000,  period: 'monthly' },
    { id: 4, category: 'subscriptions', limit: 2000,  period: 'monthly' },
    { id: 5, category: 'utilities',     limit: 3000,  period: 'monthly' },
    { id: 6, category: 'rent',          limit: 15000, period: 'monthly' },
  ]
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getData() {
  return loadData();
}

export function getUser() {
  return loadData().user;
}

export function updateUser(updates) {
  const data = loadData();
  data.user = { ...data.user, ...updates };
  saveData(data);
  return data.user;
}

export function getTransactions() {
  return loadData().transactions;
}

export function addTransactions(newTxns) {
  const data = loadData();
  const maxId = data.transactions.reduce((m, t) => Math.max(m, t.id), 0);
  const toAdd = newTxns.map((t, i) => ({ ...t, id: maxId + i + 1 }));
  data.transactions = [...data.transactions, ...toAdd];
  saveData(data);
  return data.transactions;
}

export function getSavingsGoals() {
  return loadData().savingsGoals;
}

export function addSavingsGoal(goal) {
  const data = loadData();
  const maxId = data.savingsGoals.reduce((m, g) => Math.max(m, g.id), 0);
  const newGoal = { ...goal, id: maxId + 1, createdAt: new Date().toISOString().slice(0, 10) };
  data.savingsGoals = [...data.savingsGoals, newGoal];
  saveData(data);
  return newGoal;
}

export function updateSavingsGoal(id, updates) {
  const data = loadData();
  data.savingsGoals = data.savingsGoals.map(g => g.id === id ? { ...g, ...updates } : g);
  saveData(data);
  return data.savingsGoals.find(g => g.id === id);
}

export function deleteSavingsGoal(id) {
  const data = loadData();
  data.savingsGoals = data.savingsGoals.filter(g => g.id !== id);
  saveData(data);
}

export function getBudgets() {
  return loadData().budgets;
}

export function addBudget(budget) {
  const data = loadData();
  const maxId = data.budgets.reduce((m, b) => Math.max(m, b.id), 0);
  const newBudget = { ...budget, id: maxId + 1 };
  data.budgets = [...data.budgets, newBudget];
  saveData(data);
  return newBudget;
}

export function updateBudget(id, updates) {
  const data = loadData();
  data.budgets = data.budgets.map(b => b.id === id ? { ...b, ...updates } : b);
  saveData(data);
}

export function deleteBudget(id) {
  const data = loadData();
  data.budgets = data.budgets.filter(b => b.id !== id);
  saveData(data);
}

export function resetData() {
  saveData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
}

// Auth simulation
const AUTH_KEY = 'finassist_auth';

export function login(email, password) {
  // Demo credentials
  if ((email === 'demo@finassist.in' || email === 'kartik@example.com') && password === 'Demo@123') {
    const user = getUser();
    localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, userId: user.id }));
    return { success: true, user };
  }
  return { success: false, error: 'Invalid email or password.' };
}

export function register(name, email, password) {
  const data = loadData();
  data.user = { ...data.user, name, email };
  saveData(data);
  localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, userId: 1 }));
  return { success: true, user: data.user };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    return JSON.parse(raw).loggedIn === true;
  } catch {
    return false;
  }
}
