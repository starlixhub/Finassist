// src/pages/ReportsPage.jsx
import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import Card from '../components/common/Card';
import { getTransactions, getUser } from '../data/mockData';
import { getMonthlySummary, getCategoryBreakdown } from '../utils/calculations';
import { formatCurrency, formatConvertedAmount, categoryColors, categoryLabels } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #CBD5E1',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
    }}>
      <p style={{ fontWeight: 700, fontSize: 12, color: '#334155', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 13, color: p.color || '#0F172A', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {p.name}: {typeof p.value === 'number' ? (p.name.includes('%') ? `${p.value.toFixed(1)}%` : formatConvertedAmount(p.value, currency)) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { currency, convert, symbol } = useCurrency();
  const transactions = getTransactions();
  const user = getUser();
  const income = user.monthlyIncome;

  const summary = useMemo(() => getMonthlySummary(transactions, income), [transactions, income]);
  const displaySummary = useMemo(() => summary.map(m => ({
    ...m,
    income: convert(m.income),
    expenses: convert(m.expenses),
    net: convert(m.net),
  })), [summary, convert]);

  const octBreakdown = useMemo(() => getCategoryBreakdown(transactions, 2026, 10).filter(c => c.category !== 'income').sort((a, b) => b.amount - a.amount), [transactions]);

  const savingsRateData = summary.map(m => ({
    month: m.label.split(' ')[0],
    'Savings Rate': parseFloat(m.savingsRate.toFixed(1)),
    fill: m.savingsRate >= 20 ? '#15803D' : m.savingsRate >= 10 ? '#B45309' : '#B91C1C',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        fontSize: 12,
        color: '#475569',
        padding: '8px 14px',
        background: '#F8F7F4',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <FileText size={14} style={{ color: '#4D7C0F' }} /> Verified multi-month reporting across August, September, and October 2026.
      </div>

      {/* Monthly Summary Ledger */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', marginBottom: 14 }}>
          Historical Monthly Ledger
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Month', 'Income', 'Expenses', 'Net Cash Flow', 'Savings Rate'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: h === 'Month' ? 'left' : 'right', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={row.label} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{row.label}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#15803D', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(row.income)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#B91C1C', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(row.expenses)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: row.net >= 0 ? '#4D7C0F' : '#B91C1C' }}>
                    {row.net >= 0 ? '+' : ''}{formatCurrency(row.net)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: row.savingsRate >= 20 ? '#15803D' : row.savingsRate >= 10 ? '#B45309' : '#B91C1C' }}>
                    {row.savingsRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Analytics Charts */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Income vs Expenses Trend Line */}
        <Card style={{ flex: 2, minWidth: 320 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', marginBottom: 4 }}>
            Income vs Expenditure Trajectory
          </h3>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Aug – Oct 2026 performance</p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={displaySummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false}
                tickFormatter={v => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="income" name="Income" stroke="#4D7C0F" strokeWidth={2.5} dot={{ r: 4, fill: '#4D7C0F' }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#B91C1C" strokeWidth={2.5} dot={{ r: 4, fill: '#B91C1C' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Savings Rate Bar */}
        <Card style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', marginBottom: 4 }}>
            Savings Rate Horizon
          </h3>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Percentage of income retained</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={savingsRateData} barSize={38}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              <Bar dataKey="Savings Rate" radius={[6, 6, 0, 0]}>
                {savingsRateData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Category breakdown horizontal bars */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', marginBottom: 4 }}>
          Category Share — October 2026
        </h3>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Relative allocation per category</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {octBreakdown.map(item => {
            const maxAmount = octBreakdown[0]?.amount || 1;
            const barPct = (item.amount / maxAmount) * 100;
            return (
              <div key={item.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>
                    {categoryLabels[item.category] || item.category}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${barPct}%`,
                    background: categoryColors[item.category] || '#64748B',
                    borderRadius: 999,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
