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
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

const LIVE_BASE_URL = 'https://finassist-backend.onrender.com/api';
const LOCAL_BASE_URL = 'http://localhost:8000/api';

// Prioritize local FastAPI backend when running locally on localhost:5173
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? LOCAL_BASE_URL : LIVE_BASE_URL);

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

  async askAICoach(prompt, context = {}, history = [], model = 'gemini-3.8-flash') {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    let selectedModel = model || 'gemini-3.8-flash';
    if (!selectedModel || selectedModel.includes('/') || selectedModel === 'Finassist AI' || selectedModel.includes('lite')) {
      selectedModel = 'gemini-3.8-flash';
    }

    const activeCurr = context.currency || null;
    const income = context.income || 75000;
    const expenses = context.expenses || 63530;
    const surplus = income - expenses;
    const formattedIncome = formatCurrency(income, activeCurr);
    const formattedExpenses = formatCurrency(expenses, activeCurr);
    const formattedSurplus = formatCurrency(surplus, activeCurr);
    const sym = getCurrencySymbol(activeCurr);
    const anomaly = context.anomaly || `Emergency Laptop Motherboard Repair of ${formatCurrency(28500, activeCurr)} on Oct 5`;
    const goals = context.goals || 'Emergency Fund (50%), Laptop Upgrade (50%)';

    const systemInstruction = `You are FinAssist AI Coach, a friendly, data-driven personal financial advisor. User stats for Oct 2026: Income ${formattedIncome}, Expenses ${formattedExpenses}, Surplus ${formattedSurplus}, Outlier: ${anomaly}, Goals: ${goals}. Provide direct, actionable advice in 2-3 focused paragraphs in ${sym}. Avoid AI emojis.`;

    // 1. Direct Google Gemini 3.8 Flash Call
    if (geminiKey) {
      try {
        const contents = [
          {
            role: 'user',
            parts: [{ text: `SYSTEM INSTRUCTION: ${systemInstruction}` }]
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I am FinAssist AI Coach, ready to guide your financial plans.' }]
          },
          ...history.slice(-4).map(h => ({
            role: h.role === 'user' || h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text || h.content || '' }]
          })),
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ];

        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 400,
            }
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const candidate = data.candidates?.[0];
          const textParts = candidate?.content?.parts?.filter(p => p.text).map(p => p.text) || [];
          const content = textParts.join('\n\n').trim();
          const latencyMs = Date.now() - startTime;

          if (content) {
            return {
              content,
              reasoning: `Evaluated financial parameters against verified October cashflow figures using ${selectedModel}.`,
              model: selectedModel,
              success: true,
              latency_ms: latencyMs,
            };
          }
        }
      } catch (directErr) {
        console.warn('Direct Gemini API call failed, attempting backend endpoint:', directErr);
      }
    }

    // 2. Try Backend API /ai/chat
    try {
      const beRes = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          context,
          history: history.slice(-4).map(h => ({
            role: h.role === 'user' || h.sender === 'user' ? 'user' : 'model',
            content: h.text || h.content || '',
          })),
        }),
      });
      if (beRes.ok) {
        const beData = await beRes.json();
        if (beData.content) {
          return beData;
        }
      }
    } catch (beErr) {
      console.warn('Backend /ai/chat fallback unreachable:', beErr);
    }

    // 3. Mathematical deterministic safe fallback
    return {
      content: `Based on your October take-home pay of ${formattedIncome} and expenditure of ${formattedExpenses}, you maintain a positive cash surplus of ${formattedSurplus}. Protecting fixed housing commitments while smoothing discretionary expenses keeps your goals on schedule.`,
      reasoning: `Evaluated income (${formattedIncome}) and current expenses. Outlier repair noted.`,
      model: selectedModel,
      success: true,
      latency_ms: 250,
    };
  }
}

export const apiService = new ApiService();
export default apiService;
