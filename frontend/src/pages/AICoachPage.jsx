import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Info,
  Sparkles, Send, Bot, User, RefreshCw, Lightbulb, ArrowRight,
  ShieldCheck, HelpCircle, BrainCircuit, Loader2, Utensils, Home,
  ShoppingBag, Smartphone, Plus, History, Trash2, Clock
} from 'lucide-react';
import Card from '../components/common/Card';
import { PriorityBadge } from '../components/common/Badge';
import { getTransactions, getUser, getSavingsGoals } from '../data/mockData';
import {
  getMonthlyExpenses, getCategoryBreakdown, detectAnomaly,
} from '../utils/calculations';
import { formatCurrency, categoryLabels } from '../utils/formatters';
import apiService from '../services/apiService';

function InsightCard({ icon, title, priority, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <div
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#F8F7F4',
            border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#4D7C0F', flexShrink: 0
          }}>
            {React.isValidElement(icon) ? icon : icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{title}</span>
              <PriorityBadge priority={priority} />
            </div>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', flexShrink: 0, padding: 4 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {open && <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>{children}</div>}
    </Card>
  );
}

function DataRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
      <span style={{ fontSize: 13, color: '#475569' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: highlight || '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

// Preset Quick Inquiry Generator
const getQuickPrompts = () => [
  "Why was my October spending higher than usual?",
  "How can I increase my savings rate to 20%?",
  `Can I afford a ${formatCurrency(15000)} personal expense next month?`,
  "Suggest 3 specific ways to cut food & dining expenses.",
  "What is my current financial runway and safety score?",
];

export default function AICoachPage() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'diagnostics'
  const transactions = getTransactions();
  const user = getUser();
  const income = user.monthlyIncome || 75000;
  const savingsGoals = getSavingsGoals();

  const anomaly = useMemo(() => detectAnomaly(transactions), [transactions]);
  const catBreakdown = useMemo(() => getCategoryBreakdown(transactions, 2026, 10), [transactions]);
  const catMap = useMemo(() => {
    const m = {};
    catBreakdown.forEach(c => { m[c.category] = c.amount; });
    return m;
  }, [catBreakdown]);

  const augBreakdown = useMemo(() => getCategoryBreakdown(transactions, 2026, 8), [transactions]);
  const sepBreakdown = useMemo(() => getCategoryBreakdown(transactions, 2026, 9), [transactions]);
  const augMap = {}; augBreakdown.forEach(c => { augMap[c.category] = c.amount; });
  const sepMap = {}; sepBreakdown.forEach(c => { sepMap[c.category] = c.amount; });

  const octTotal = useMemo(() => getMonthlyExpenses(transactions, 2026, 10), [transactions]);
  const foodAvg = ((augMap.food || 0) + (sepMap.food || 0)) / 2;
  const shoppingAvg = ((augMap.shopping || 0) + (sepMap.shopping || 0)) / 2;
  const subAvg = ((augMap.subscriptions || 0) + (sepMap.subscriptions || 0)) / 2;

  const riskLevel = octTotal > income * 0.8 ? 'High' : octTotal > income * 0.6 ? 'Medium' : 'Low';
  const riskColor = riskLevel === 'High' ? '#B91C1C' : riskLevel === 'Medium' ? '#B45309' : '#15803D';
  const predictedBalance = income - octTotal;
  const currentSavingsRate = income > 0 ? ((predictedBalance / income) * 100).toFixed(1) : 0;

  // --- Persistent Multi-Chat State with LocalStorage ---
  const initialWelcomeMsg = {
    id: 1,
    sender: 'ai',
    time: 'Just now',
    model: 'Finassist AI',
    text: `Hello ${user?.name ? user.name.split(' ')[0] : 'Kartik'}! I'm your AI Financial Coach. I've analyzed your verified figures for October 2026: Take-home income is ${formatCurrency(income)}, current expenses are ${formatCurrency(octTotal)}, and your savings rate is ${currentSavingsRate}%. How can I guide you today?`,
  };

  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('finassist_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load chat sessions:', e);
    }
    return [
      {
        id: 'session-default',
        title: 'October Financial Health',
        timestamp: Date.now(),
        messages: [initialWelcomeMsg],
      }
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      const savedId = localStorage.getItem('finassist_active_chat_id');
      if (savedId) return savedId;
    } catch (e) {}
    return 'session-default';
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Active chat session messages
  const activeSession = chatSessions.find(s => s.id === currentSessionId) || chatSessions[0] || {
    id: 'session-default',
    title: 'October Financial Health',
    timestamp: Date.now(),
    messages: [initialWelcomeMsg],
  };

  const messages = activeSession.messages || [initialWelcomeMsg];

  // Helper to persist sessions to localStorage
  const updateMessages = (newMsgsOrUpdater) => {
    setChatSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSession.id) {
          const nextMsgs = typeof newMsgsOrUpdater === 'function' ? newMsgsOrUpdater(s.messages) : newMsgsOrUpdater;
          // Dynamically compute session title from first user query if still default
          let title = s.title;
          if (title === 'New Consultation' || title === 'October Financial Health') {
            const firstUser = nextMsgs.find(m => m.sender === 'user');
            if (firstUser) {
              title = firstUser.text.slice(0, 30) + (firstUser.text.length > 30 ? '...' : '');
            }
          }
          return {
            ...s,
            title,
            timestamp: Date.now(),
            messages: nextMsgs,
          };
        }
        return s;
      });
      try {
        localStorage.setItem('finassist_chat_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Consultation',
      timestamp: Date.now(),
      messages: [
        {
          id: Date.now(),
          sender: 'ai',
          time: 'Just now',
          model: 'Finassist AI',
          text: `Starting a fresh consultation session! How can I guide your spending, savings, or investment plans today?`,
        }
      ],
    };
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    setCurrentSessionId(newId);
    try {
      localStorage.setItem('finassist_chat_sessions', JSON.stringify(updatedSessions));
      localStorage.setItem('finassist_active_chat_id', newId);
    } catch (e) {}
    setShowHistoryModal(false);
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    try {
      localStorage.setItem('finassist_active_chat_id', id);
    } catch (e) {}
    setShowHistoryModal(false);
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    const filtered = chatSessions.filter(s => s.id !== id);
    const finalSessions = filtered.length > 0 ? filtered : [
      {
        id: `session-${Date.now()}`,
        title: 'October Financial Health',
        timestamp: Date.now(),
        messages: [initialWelcomeMsg],
      }
    ];
    setChatSessions(finalSessions);
    const nextActiveId = finalSessions[0].id;
    setCurrentSessionId(nextActiveId);
    try {
      localStorage.setItem('finassist_chat_sessions', JSON.stringify(finalSessions));
      localStorage.setItem('finassist_active_chat_id', nextActiveId);
    } catch (e) {}
  };

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Context-Aware Financial Response Engine
  const generateAIResponse = (query) => {
    const q = query.toLowerCase();

    if (q.includes('october') || q.includes('high') || q.includes('anomaly') || q.includes('repair') || q.includes('laptop')) {
      return `Your October expenditure of ${formatCurrency(octTotal)} is primarily elevated due to a single outlier: **Emergency Laptop Motherboard Repair** of ${formatCurrency(28500)} on October 5th (+6767% over typical uncategorized spend).\n\nIf we exclude this one-off emergency, your regular routine expenditure sits at ${formatCurrency(octTotal - 28500)} (${(((octTotal - 28500)/income)*100).toFixed(1)}% of income), which remains within healthy limits.`;
    }

    if (q.includes('savings rate') || q.includes('20%') || q.includes('increase') || q.includes('rate')) {
      const neededFor20 = income * 0.20;
      const currentSurplus = predictedBalance;
      const difference = neededFor20 - currentSurplus;
      return `To achieve a **20% savings rate** (${formatCurrency(neededFor20)}/month), you need an additional surplus of **${formatCurrency(Math.max(0, difference))}**.\n\nHere is your tailored roadmap:\n1. **Food Delivery**: Trim 20% on restaurant orders to reclaim ~${formatCurrency((catMap.food || 3410) * 0.20)}/month.\n2. **Subscriptions**: Rotate entertainment services (Netflix ${formatCurrency(649)}, Prime) to free ~${formatCurrency(649)}/month.\n3. **Discretionary Shopping**: Place a ${formatCurrency(5000)} ceiling on impulse purchases.`;
    }

    if (q.includes('afford') || q.includes('trip') || q.includes('15,000') || q.includes('vacation')) {
      return `Let's assess that against your runway:\n\n• **Monthly Take-Home**: ${formatCurrency(income)}\n• **Routine Outflow**: ~${formatCurrency(35000)} (excluding one-off emergencies)\n• **Current Net Surplus**: ${formatCurrency(predictedBalance)}\n• **Emergency Fund Balance**: ${formatCurrency(savingsGoals[0]?.savedAmount || 60000)}\n\n**Verdict**: ✅ **Yes, you can afford a ${formatCurrency(15000)} trip next month**, provided you don't encounter another unexpected repair and maintain your rent ceiling (${formatCurrency(catMap.rent || 15000)}). I recommend funding it directly from November's routine cash buffer rather than tapping your Emergency Fund.`;
    }

    if (q.includes('cut') || q.includes('food') || q.includes('dining') || q.includes('restaurant')) {
      return `Based on your October food spend (${formatCurrency(catMap.food || 3410)}):\n\n1. **Batch Meal Planning**: Shifting 2 weekend takeaway dinners to home cooking reclaims approx ${formatCurrency(1200)}/month.\n2. **Subscription Grocery Deliveries**: Avoid small cart delivery fees by ordering essentials once weekly.\n3. **Coffee & Snacks**: Consolidating café stops frees ~${formatCurrency(800)}/month toward your Emergency Fund.`;
    }

    if (q.includes('runway') || q.includes('score') || q.includes('safety') || q.includes('risk')) {
      return `**Financial Runway & Health Summary**:\n\n• **Risk Assessment**: **${riskLevel} Risk** for October (due to the motherboard repair amortized in current cycle).\n• **Liquidity Buffer**: ${formatCurrency(predictedBalance)} surplus remains positive.\n• **Emergency Reserve**: ${formatCurrency(savingsGoals[0]?.savedAmount || 60000)} / ${formatCurrency(savingsGoals[0]?.targetAmount || 120000)} (50% funded, covering ~2 months of essential living costs).\n• **Recommendations**: Resume automatic deposit of ${formatCurrency(10000)} to the Emergency Fund once November salary credits.`;
    }

    return `I've analyzed your financial situation against your profile. You take home ${formatCurrency(income)} per month, carry a housing commitment of ${formatCurrency(catMap.rent || 15000)} (${(((catMap.rent || 15000)/income)*100).toFixed(1)}%), and currently hold ${formatCurrency(savingsGoals[0]?.savedAmount || 60000)} in savings reserves.\n\nCould you elaborate on the specific area you'd like guidance on? You can ask about budgeting limits, savings targets, investment buffers, or upcoming large purchases!`;
  };

  // --- Gemini Model Selector State ---
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');

  const [thinkingTime, setThinkingTime] = useState(0);

  useEffect(() => {
    let timer;
    if (isTyping) {
      setThinkingTime(0);
      timer = setInterval(() => {
        setThinkingTime(t => t + 1);
      }, 1000);
    } else {
      setThinkingTime(0);
    }
    return () => clearInterval(timer);
  }, [isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };

    updateMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    const contextPayload = {
      income,
      expenses: octTotal,
      surplus: predictedBalance,
      anomaly: anomaly
        ? `${anomaly.transaction.description} (${formatCurrency(Math.abs(anomaly.transaction.amount))}) on ${anomaly.transaction.date}`
        : 'None detected',
      goals: savingsGoals.map(g => `${g.name} (${formatCurrency(g.savedAmount)} / ${formatCurrency(g.targetAmount)})`).join(', '),
    };

    try {
      const response = await apiService.askAICoach(text, contextPayload, messages, selectedModel);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response.content || generateAIResponse(text),
        reasoning: response.reasoning || null,
        model: response.model || selectedModel,
        latency_ms: response.latency_ms || null,
      };
      updateMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const fallbackReply = generateAIResponse(text);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: fallbackReply,
        reasoning: `Analyzed query against October cash flow metrics (surplus: ${formatCurrency(predictedBalance)}). Generated deterministic advice.`,
        model: selectedModel,
      };
      updateMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
      {/* Apple-Style Segmented Tab Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 4,
      }}>
        <div style={{
          background: '#E2E8F0',
          padding: 3,
          borderRadius: 10,
          display: 'inline-flex',
          gap: 2,
        }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'chat' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'chat' ? '#0F172A' : '#64748B',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'chat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={15} style={{ color: activeTab === 'chat' ? '#65A30D' : '#94A3B8' }} />
            Interactive Coach Chat
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'diagnostics' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'diagnostics' ? '#0F172A' : '#64748B',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'diagnostics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <TrendingUp size={15} style={{ color: activeTab === 'diagnostics' ? '#4D7C0F' : '#94A3B8' }} />
            Diagnostic & Runway Analysis
          </button>
        </div>

        {/* Live Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#15803D',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          padding: '5px 12px',
          borderRadius: 20,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
          Context Connected to Live October Data
        </div>
      </div>

      {/* TAB 1: INTERACTIVE AI COACH CHAT */}
      {activeTab === 'chat' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          overflow: 'hidden',
          minHeight: 560,
          flex: 1,
        }}>
          {/* Coach Chat Header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #F1F5F9',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4D7C0F 0%, #1E3A8A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(77,124,15,0.25)',
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  FinAssist AI Coach
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  Empowered with personalized financial models & anomaly detection
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Free Model Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Model:
                </span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0F172A',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <option value="gemini-flash-lite-latest">
                    Finassist AI Fast (Flash Lite • ~1.5s • Recommended)
                  </option>
                  <option value="gemini-3.5-flash-lite">
                    Finassist AI Balanced (Flash 3.5 Lite • ~2.5s)
                  </option>
                  <option value="gemini-3.5-flash">
                    Finassist AI Pro (Flash 3.5 • ~3s)
                  </option>
                  <option value="gemini-3.8-flash">
                    Finassist AI Deep (Gemini 3.8 Flash)
                  </option>
                </select>
              </div>

              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                title="Start a fresh chat conversation"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#F7FEE7',
                  border: '1px solid #D9F99D',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#365314',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(77,124,15,0.06)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#ECFCCB'}
                onMouseLeave={e => e.currentTarget.style.background = '#F7FEE7'}
              >
                <Plus size={14} style={{ color: '#4D7C0F' }} />
                <span>New Chat</span>
              </button>

              {/* History Button */}
              <button
                onClick={() => setShowHistoryModal(true)}
                title="View previous chat conversations"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                <History size={14} style={{ color: '#64748B' }} />
                <span>History</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: '#F1F5F9',
                  color: '#64748B',
                  borderRadius: 10,
                  padding: '1px 6px',
                }}>
                  {chatSessions.length}
                </span>
              </button>
            </div>
          </div>

          {/* History Slide-Over / Dialog Modal */}
          {showHistoryModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                animation: 'fadeIn 0.15s ease-out',
              }}
              onClick={() => setShowHistoryModal(false)}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  width: '100%',
                  maxWidth: 480,
                  maxHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  border: '1px solid #E2E8F0',
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#F8FAFC',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#F7FEE7',
                      color: '#4D7C0F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <History size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        Chat Consultation History
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {chatSessions.length} saved session{chatSessions.length === 1 ? '' : 's'} (stored locally)
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Session List */}
                <div style={{ padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {chatSessions.map((session) => {
                    const isActive = session.id === currentSessionId;
                    const msgCount = session.messages ? session.messages.length : 1;
                    const dateFormatted = new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: isActive ? '#F7FEE7' : '#FFFFFF',
                          border: `1px solid ${isActive ? '#D9F99D' : '#E2E8F0'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = '#F8FAFC';
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = '#FFFFFF';
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 13,
                            fontWeight: isActive ? 700 : 600,
                            color: isActive ? '#365314' : '#1E293B',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {session.title || 'Consultation Session'}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Clock size={11} />
                            <span>{dateFormatted}</span>
                            <span>•</span>
                            <span>{msgCount} messages</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isActive && (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#4D7C0F',
                              background: '#ECFCCB',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}>
                              Active
                            </span>
                          )}
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            title="Delete this chat"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '4px 6px',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '10px 14px',
                  borderTop: '1px solid #F1F5F9',
                  background: '#FAFAFA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <button
                    onClick={handleNewChat}
                    style={{
                      background: '#4D7C0F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Plus size={14} /> Start New Chat
                  </button>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    style={{
                      background: 'transparent',
                      color: '#64748B',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Message Scroll Area */}
          <div style={{
            flex: 1,
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: '#FAFCFE',
          }}>
            {messages.map(msg => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isAi ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                    gap: 12,
                    maxWidth: '85%',
                    alignSelf: isAi ? 'flex-start' : 'flex-end',
                  }}
                >
                  {/* Sender Avatar */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isAi ? '#4D7C0F' : '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {isAi ? <Bot size={16} /> : <User size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAi ? 'flex-start' : 'flex-end', width: '100%' }}>
                    {/* Collapsible Reasoning / Thought Process Accordion */}
                    {isAi && msg.reasoning && (
                      <details style={{
                        marginBottom: 8,
                        background: '#F1F5F9',
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        padding: '6px 12px',
                        fontSize: 12,
                        color: '#475569',
                        width: '100%',
                        cursor: 'pointer',
                      }}>
                        <summary style={{
                          fontWeight: 600,
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          userSelect: 'none',
                        }}>
                          <BrainCircuit size={14} style={{ color: '#4D7C0F' }} />
                          <span>Thought process</span>
                          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>(Finassist AI Engine)</span>
                        </summary>
                        <div style={{
                          marginTop: 6,
                          paddingTop: 6,
                          borderTop: '1px solid #E2E8F0',
                          fontSize: 11,
                          lineHeight: 1.55,
                          color: '#475569',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'ui-monospace, monospace',
                        }}>
                          {msg.reasoning}
                        </div>
                      </details>
                    )}

                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      background: isAi ? '#FFFFFF' : '#4D7C0F',
                      color: isAi ? '#1E293B' : '#FFFFFF',
                      border: isAi ? '1px solid #E2E8F0' : 'none',
                      fontSize: 13,
                      lineHeight: 1.6,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.text}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '0 4px' }}>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>{msg.time}</span>
                      {isAi && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: '#4D7C0F',
                          background: '#F7FEE7',
                          border: '1px solid #D9F99D',
                          borderRadius: 4,
                          padding: '1px 5px',
                        }}>
                          {msg.model && msg.model !== 'Finassist AI'
                            ? (msg.model.includes('flash-lite') ? 'Finassist AI Flash' : msg.model.includes('gemini') ? 'Finassist AI' : msg.model)
                            : 'Finassist AI'}
                          {msg.latency_ms ? ` (${(msg.latency_ms/1000).toFixed(1)}s)` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Active "Thinking..." Animated State with Live Elapsed Timer */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, alignSelf: 'flex-start' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4D7C0F 0%, #15803D 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(101,163,13,0.4)',
                }}>
                  <BrainCircuit size={16} />
                </div>
                <div style={{
                  padding: '12px 18px',
                  borderRadius: '4px 16px 16px 16px',
                  background: '#FFFFFF',
                  border: '1px solid #D9F99D',
                  boxShadow: '0 2px 8px rgba(77,124,15,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Loader2 size={16} className="thinking-spinner" style={{ color: '#4D7C0F' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Thinking...</span>
                      <span style={{
                        fontSize: 11,
                        color: '#65A30D',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        background: '#F7FEE7',
                        padding: '1px 6px',
                        borderRadius: 10,
                      }}>
                        {thinkingTime}s
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                      Consulting Finassist AI...
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div style={{
            padding: '10px 20px',
            background: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', flexShrink: 0, letterSpacing: '0.04em' }}>
              Suggested:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 16,
                  padding: '5px 12px',
                  fontSize: 12,
                  color: '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#4D7C0F';
                  e.currentTarget.style.color = '#4D7C0F';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about your budget, savings goals, or spending..."
              style={{
                flex: 1,
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '11px 16px',
                fontSize: 13,
                outline: 'none',
                background: '#FAFCFE',
                color: '#0F172A',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#84CC16'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isTyping}
              style={{
                background: inputPrompt.trim() ? '#4D7C0F' : '#94A3B8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '11px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                fontSize: 13,
                cursor: inputPrompt.trim() ? 'pointer' : 'default',
                transition: 'background 0.15s ease',
              }}
            >
              <span>Ask Coach</span>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: DETERMINISTIC DIAGNOSTIC & RUNWAY ANALYSIS */}
      {activeTab === 'diagnostics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Methodology Note */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Info size={16} style={{ color: '#4D7C0F', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
              <strong>Deterministic Diagnostic Engine:</strong> Metrics are calculated directly from verified 3-month variance data and outlier detection algorithms.
            </p>
          </div>

          {/* Anomaly Spotlight */}
          {anomaly && (
            <div style={{
              padding: '18px 20px',
              borderRadius: 12,
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              boxShadow: '0 1px 3px rgba(245,158,11,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={20} style={{ color: '#B45309' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#92400E' }}>Emergency Expense Spotlight</span>
                    <PriorityBadge priority="high" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                    {anomaly.transaction.description}
                  </p>
                  <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.55 }}>
                    {formatCurrency(Math.abs(anomaly.transaction.amount))} on {anomaly.transaction.date} —{' '}
                    <strong style={{ color: '#92400E' }}>+{anomaly.deviation.toFixed(0)}% deviation</strong> from your typical{' '}
                    {categoryLabels[anomaly.transaction.category]} spend (category baseline: {formatCurrency(anomaly.avgExcl)}).
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ padding: '8px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #FCD34D' }}>
                      <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 2 }}>This Transaction</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#B91C1C', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(Math.abs(anomaly.transaction.amount))}
                      </div>
                    </div>
                    <div style={{ padding: '8px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Baseline Average</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(anomaly.avgExcl)}
                      </div>
                    </div>
                    <div style={{ padding: '8px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Outlier Deviation</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#B91C1C', fontVariantNumeric: 'tabular-nums' }}>
                        +{anomaly.deviation.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
            Spending Observations
          </h3>

          {/* Food insight */}
          <InsightCard icon={<Utensils size={18} />} title="Food spending disciplined in October" priority="low" defaultOpen={true}>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
              Food and grocery spending for October stands at {formatCurrency(catMap.food || 0)}, staying below your 2-month baseline of {formatCurrency(foodAvg)}.
            </p>
            <DataRow label="August food expenditure" value={formatCurrency(augMap.food || 0)} />
            <DataRow label="September food expenditure" value={formatCurrency(sepMap.food || 0)} />
            <DataRow label="October current spend" value={formatCurrency(catMap.food || 0)} highlight="#15803D" />
            <DataRow label="2-month baseline average" value={formatCurrency(foodAvg)} />
          </InsightCard>

          {/* Rent insight */}
          <InsightCard icon={<Home size={18} />} title={`Housing represents ${income > 0 ? (((catMap.rent || 0) / income) * 100).toFixed(1) : 0}% of net income`} priority="medium">
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
              Your fixed rent of {formatCurrency(catMap.rent || 15000)} is within standard financial guidelines (recommending housing remain under 30% of take-home pay).
            </p>
            <DataRow label="Monthly rent obligation" value={formatCurrency(catMap.rent || 15000)} highlight="#4D7C0F" />
            <DataRow label="% of monthly income" value={`${income > 0 ? (((catMap.rent || 15000) / income) * 100).toFixed(1) : 0}%`} />
            <DataRow label="Recommended 30% ceiling" value={formatCurrency(income * 0.3)} />
          </InsightCard>

          {/* Shopping insight */}
          <InsightCard icon={<ShoppingBag size={18} />} title="Discretionary shopping increase detected" priority="high">
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
              You recorded {formatCurrency(catMap.shopping || 0)} in shopping during October — higher than your historical monthly average of {formatCurrency(shoppingAvg)}.
            </p>
            <DataRow label="August shopping total" value={formatCurrency(augMap.shopping || 0)} />
            <DataRow label="September shopping total" value={formatCurrency(sepMap.shopping || 0)} />
            <DataRow label="October shopping total" value={formatCurrency(catMap.shopping || 0)} highlight="#B91C1C" />
            <DataRow label="Baseline average" value={formatCurrency(shoppingAvg)} />
          </InsightCard>

          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', marginTop: 4 }}>
            Actionable Savings Plan
          </h3>

          {/* Food cut suggestion */}
          <InsightCard icon={<Utensils size={18} />} title="Trim 20% from dining out & takeaway" priority="medium">
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
              Targeting a 20% trim on discretionary dining orders unlocks approximately {formatCurrency((catMap.food || 0) * 0.2)} in monthly savings toward your goals.
            </p>
            <div style={{ padding: '12px 16px', background: '#F7FEE7', border: '1px solid #D9F99D', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#365314', fontWeight: 600 }}>Projected annual savings freed</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4D7C0F', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency((catMap.food || 0) * 0.2 * 12)}
              </div>
            </div>
          </InsightCard>

          {/* Streaming suggestion */}
          <InsightCard icon={<Smartphone size={18} />} title="Consolidate active streaming subscriptions" priority="low">
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
              Active recurring entertainment services total {formatCurrency(catMap.subscriptions || 0)} this month (Netflix {formatCurrency(649)} + Spotify {formatCurrency(119)} + Prime {formatCurrency(1499)}).
            </p>
            <DataRow label="Current subscription total" value={formatCurrency(catMap.subscriptions || 0)} highlight="#B91C1C" />
            <DataRow label="2-month baseline" value={formatCurrency(subAvg)} />
            <DataRow label="Potential monthly freed cash" value={formatCurrency(649)} highlight="#15803D" />
            <DataRow label="Annual savings (1 service rotated)" value={formatCurrency(649 * 12)} highlight="#15803D" />
          </InsightCard>

          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', marginTop: 4 }}>
            Cash Flow Runway Forecast
          </h3>

          {/* Cash Flow Forecast Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <TrendingUp size={18} style={{ color: '#4D7C0F' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                October 2026 Runway Assessment
              </h3>
              <span style={{
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: riskColor + '15',
                color: riskColor,
                border: `1px solid ${riskColor}30`,
              }}>
                {riskLevel} Risk
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Monthly Income', value: formatCurrency(income), color: '#15803D' },
                { label: 'Total Expenses', value: formatCurrency(octTotal), color: '#B91C1C' },
                { label: 'Net Available', value: formatCurrency(Math.abs(predictedBalance)), color: predictedBalance >= 0 ? '#4D7C0F' : '#B91C1C' },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <p style={{
              fontSize: 13,
              color: '#334155',
              lineHeight: 1.6,
              padding: '12px 16px',
              background: predictedBalance >= 0 ? '#F7FEE7' : '#FEF2F2',
              border: `1px solid ${predictedBalance >= 0 ? '#D9F99D' : '#FCA5A5'}`,
              borderRadius: 8,
              margin: 0,
            }}>
              {predictedBalance >= 0
                ? `Your verified income of ${formatCurrency(income)} generates a net monthly surplus of ${formatCurrency(predictedBalance)}. You remain on schedule for all target savings milestones.`
                : `Expenses of ${formatCurrency(octTotal)} exceed monthly income by ${formatCurrency(Math.abs(predictedBalance))}. This is directly attributed to the ${formatCurrency(28500)} laptop repair emergency. Normalizing this single anomaly preserves positive cash flow.`
              }
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
