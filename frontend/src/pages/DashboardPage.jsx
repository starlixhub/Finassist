// src/pages/DashboardPage.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight, Wallet } from 'lucide-react';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';
import { CategoryBadge } from '../components/common/Badge';
import { getTransactions, getUser, getSavingsGoals } from '../data/mockData';
import {
  getMonthlyExpenses, getMonthlyIncome, getCategoryBreakdown,
  getNetCashFlow, getSavingsRate, getSpendingTrend, detectAnomaly,
} from '../utils/calculations';
import { formatCurrency, formatDate, categoryColors, categoryLabels } from '../utils/formatters';

const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 10;

function MetricCard({ label, value, subtext, trend, accentColor, icon }) {
  const trendColor = trend === 'up' ? '#07704A' : trend === 'down' ? '#B42318' : '#52607A';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <Card accentColor={accentColor} style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#52607A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0F1B2D', marginBottom: 6 }}>{value}</div>
      {subtext && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendIcon size={13} style={{ color: trendColor }} />
          <span style={{ fontSize: 12, color: trendColor, fontWeight: 500 }}>{subtext}</span>
        </div>
      )}
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #D9E0E9', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(15,27,45,0.1)' }}>
      <p style={{ fontWeight: 700, fontSize: 12, color: '#52607A', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const transactions = getTransactions();
  const user = getUser();
  const savingsGoals = getSavingsGoals();
  const income = user.monthlyIncome;

  const monthExpenses = useMemo(() => getMonthlyExpenses(transactions, CURRENT_YEAR, CURRENT_MONTH), [transactions]);
  const monthIncome = useMemo(() => getMonthlyIncome(transactions, CURRENT_YEAR, CURRENT_MONTH, income), [transactions, income]);
  const netCashFlow = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? (netCashFlow / monthIncome) * 100 : 0;

  const categoryBreakdown = useMemo(() => getCategoryBreakdown(transactions, CURRENT_YEAR, CURRENT_MONTH), [transactions]);
  const trendData = useMemo(() => getSpendingTrend(transactions, 3, income), [transactions, income]);
  const anomaly = useMemo(() => detectAnomaly(transactions), [transactions]);

  const recentTxns = useMemo(() =>
    [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
    [transactions]
  );

  const pieData = categoryBreakdown
    .filter(c => c.category !== 'income')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Anomaly Banner */}
      {anomaly && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: '#FFFBEB', border: '1px solid #FCD34D',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertTriangle size={18} style={{ color: '#8F5200', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#8F5200' }}>Anomaly Detected: </span>
            <span style={{ fontSize: 13, color: '#0F1B2D' }}>
              {anomaly.transaction.description} — {formatCurrency(Math.abs(anomaly.transaction.amount))} is{' '}
              <strong>{anomaly.deviation.toFixed(0)}% above</strong> your typical{' '}
              {categoryLabels[anomaly.transaction.category]} spend
            </span>
          </div>
          <button
            onClick={() => navigate('/ai-coach')}
            style={{ background: 'none', border: 'none', color: '#8F5200', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            View Insights →
          </button>
        </div>
      )}

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MetricCard
          label="Monthly Income"
          value={formatCurrency(monthIncome)}
          subtext="Regular salary"
          trend="up"
          accentColor="#07704A"
          icon="💰"
        />
        <MetricCard
          label="Total Expenses"
          value={formatCurrency(monthExpenses)}
          subtext={`${((monthExpenses / monthIncome) * 100).toFixed(1)}% of income`}
          trend={monthExpenses > monthIncome * 0.8 ? 'down' : 'neutral'}
          accentColor="#B42318"
          icon="💳"
        />
        <MetricCard
          label="Net Cash Flow"
          value={`${netCashFlow >= 0 ? '+' : ''}${formatCurrency(Math.abs(netCashFlow))}`}
          subtext={netCashFlow >= 0 ? 'Positive balance' : 'Overspent!'}
          trend={netCashFlow >= 0 ? 'up' : 'down'}
          accentColor={netCashFlow >= 0 ? '#0B6E6E' : '#B42318'}
          icon="📊"
        />
        <MetricCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          subtext={savingsRate >= 20 ? 'Great job!' : savingsRate >= 10 ? 'Moderate' : 'Below target'}
          trend={savingsRate >= 20 ? 'up' : savingsRate >= 10 ? 'neutral' : 'down'}
          accentColor="#0B6E6E"
          icon="🎯"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Cash Flow Chart */}
        <Card style={{ flex: 2, minWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>Cash Flow</h3>
              <p style={{ fontSize: 12, color: '#52607A' }}>Last 3 months comparison</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barSize={28} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#52607A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#52607A' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#0B6E6E" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#FBBF24" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut Chart */}
        <Card style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 2 }}>Spending Breakdown</h3>
          <p style={{ fontSize: 12, color: '#52607A', marginBottom: 8 }}>October 2026</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                dataKey="amount"
                nameKey="category"
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={entry.category}
                    fill={categoryColors[entry.category] || '#9CA3AF'}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.6}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pieData.slice(0, 4).map(item => (
              <div key={item.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColors[item.category] || '#9CA3AF', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#52607A' }}>{categoryLabels[item.category]}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0F1B2D' }}>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Savings Goals */}
        <Card style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>Savings Goals</h3>
            <button onClick={() => navigate('/savings')} style={{ background: 'none', border: 'none', color: '#0B6E6E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {savingsGoals.slice(0, 2).map(goal => {
              const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
              return (
                <div key={goal.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{goal.name}</div>
                      <div style={{ fontSize: 11, color: '#52607A' }}>
                        {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0B6E6E' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={goal.savedAmount} max={goal.targetAmount} color="#0B6E6E" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card style={{ flex: 2, minWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>Recent Transactions</h3>
            <button onClick={() => navigate('/transactions')} style={{ background: 'none', border: 'none', color: '#0B6E6E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div>
            {recentTxns.map(txn => (
              <div key={txn.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: '1px solid #F5F7FA',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {txn.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#52607A' }}>{formatDate(txn.date)}</span>
                    <CategoryBadge category={txn.category} />
                  </div>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700, marginLeft: 12, whiteSpace: 'nowrap',
                  color: txn.type === 'income' ? '#07704A' : '#B42318',
                }}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
