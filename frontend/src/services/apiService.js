// src/services/apiService.js
/**
 * FinAssist API Service Layer
 * 
 * Provides typed, clean contract methods to interact with either the live
 * FastAPI backend (Render / local dev) or local fallback.
 * 
 * Endpoints matched to API.md:
 * - POST /api/income
 * - POST /api/transactions/upload
 * - GET  /api/dashboard?user_id=1
 * - GET  /api/predict?user_id=1&days_ahead=30
 * - POST /api/savings-goal
 * - GET  /api/savings-plan?user_id=1
 * - GET  /api/anomaly-spotlight?user_id=1
 */

const LIVE_BASE_URL = 'https://finassist-backend.onrender.com/api';
const LOCAL_BASE_URL = 'http://localhost:8000/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL || LIVE_BASE_URL;

class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async setIncome(userId = 1, monthlyIncome) {
    const res = await fetch(`${this.baseUrl}/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, monthly_income: monthlyIncome }),
    });
    if (!res.ok) throw new Error(`Failed to set income: ${res.statusText}`);
    return res.json();
  }

  async uploadTransactionsCsv(file, userId = 1) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', String(userId));

    const res = await fetch(`${this.baseUrl}/transactions/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.detail || 'Upload failed');
    }
    return res.json();
  }

  async getDashboard(userId = 1) {
    const res = await fetch(`${this.baseUrl}/dashboard?user_id=${userId}`);
    if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.statusText}`);
    return res.json();
  }

  async getPrediction(userId = 1, daysAhead = 30) {
    const res = await fetch(`${this.baseUrl}/predict?user_id=${userId}&days_ahead=${daysAhead}`);
    if (!res.ok) throw new Error(`Prediction fetch failed: ${res.statusText}`);
    return res.json();
  }

  async createSavingsGoal(userId = 1, targetAmount, targetMonths) {
    const res = await fetch(`${this.baseUrl}/savings-goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        target_amount: targetAmount,
        target_months: targetMonths,
      }),
    });
    if (!res.ok) throw new Error(`Savings goal creation failed: ${res.statusText}`);
    return res.json();
  }

  async getSavingsPlan(userId = 1) {
    const res = await fetch(`${this.baseUrl}/savings-plan?user_id=${userId}`);
    if (!res.ok) throw new Error(`Savings plan fetch failed: ${res.statusText}`);
    return res.json();
  }

  async getAnomalySpotlight(userId = 1) {
    const res = await fetch(`${this.baseUrl}/anomaly-spotlight?user_id=${userId}`);
    if (!res.ok) throw new Error(`Anomaly spotlight fetch failed: ${res.statusText}`);
    return res.json();
  }
}

export const apiService = new ApiService();
export default apiService;
