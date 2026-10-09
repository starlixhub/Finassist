// src/pages/ReportsPage.jsx
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import Card from '../components/common/Card';
import { getTransactions, getUser } from '../data/mockData';
import { getMonthlySummary, getCategoryBreakdown } from '../utils/calculations';
import { formatCurrency, categoryColors, categoryLabels } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #D9E0E9', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(15,27,45,0.1)' }}>
      <p style={{ fontWeight: 700, fontSize: 12, color: '#52607A', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 13, color: p.color || '#0F1B2D', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? (p.name.includes('%') ? `${p.value.toFixed(1)}%` : formatCurrency(p.value)) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const transactions = getTransactions();
  const user = getUser();
  const income = user.monthlyIncome;

  const summary = useMemo(() => getMonthlySummary(transactions, income), [transactions, income]);

  const octBreakdown = useMemo(() => getCategoryBreakdown(transactions, 2026, 10).filter(c => c.category !== 'income').sort((a, b) => b.amount - a.amount), [transactions]);

  const savingsRateData = summary.map(m => ({
    month: m.label.split(' ')[0],
    'Savings Rate': parseFloat(m.savingsRate.toFixed(1)),
    fill: m.savingsRate >= 20 ? '#07704A' : m.savingsRate >= 10 ? '#8F5200' : '#B42318',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 12, color: '#52607A', padding: '6px 12px', background: '#F5F7FA', borderRadius: 6, border: '1px solid #D9E0E9', display: 'inline-block' }}>
        📋 Reports reflect demo data for Aug–Oct 2026.
      </p>

      {/* Monthly Summary Table */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 14 }}>Monthly Summary</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F7FA', borderBottom: '1px solid #D9E0E9' }}>
                {['Month', 'Income', 'Expenses', 'Net Cash Flow', 'Savings Rate'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Month' ? 'left' : 'right', fontSize: 12, fontWeight: 700, color: '#52607A' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={row.label} style={{ borderBottom: '1px solid #F5F7FA', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{row.label}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#07704A' }}>{formatCurrency(row.income)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#B42318' }}>{formatCurrency(row.expenses)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: row.net >= 0 ? '#0B6E6E' : '#B42318' }}>
                    {row.net >= 0 ? '+' : ''}{formatCurrency(row.net)}
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: row.savingsRate >= 20 ? '#07704A' : row.savingsRate >= 10 ? '#8F5200' : '#B42318' }}>
                    {row.savingsRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Income vs Expenses Line Chart */}
        <Card style={{ flex: 2, minWidth: 300 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 4 }}>Income vs Expenses Trend</h3>
          <p style={{ fontSize: 12, color: '#52607A', marginBottom: 16 }}>Aug – Oct 2026</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={summary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#52607A' }} axisLine={false} tickLine={false}
                tickFormatter={v => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 11, fill: '#52607A' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="income" name="Income" stroke="#0B6E6E" strokeWidth={2.5} dot={{ r: 4, fill: '#0B6E6E' }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#B42318" strokeWidth={2.5} dot={{ r: 4, fill: '#B42318' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Savings Rate Chart */}
        <Card style={{ flex: 1, minWidth: 240 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 4 }}>Savings Rate</h3>
          <p style={{ fontSize: 12, color: '#52607A', marginBottom: 16 }}>% of income saved</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={savingsRateData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#52607A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#52607A' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              <Bar dataKey="Savings Rate" radius={[4, 4, 0, 0]}>
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
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 4 }}>Category Breakdown — October 2026</h3>
        <p style={{ fontSize: 12, color: '#52607A', marginBottom: 16 }}>Total spending by category</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {octBreakdown.map(item => {
            const maxAmount = octBreakdown[0]?.amount || 1;
            const barPct = (item.amount / maxAmount) * 100;
            return (
              <div key={item.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#0F1B2D', fontWeight: 500 }}>
                    {categoryLabels[item.category] || item.category}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{formatCurrency(item.amount)}</span>
                </div>
                <div style={{ height: 8, background: '#F5F7FA', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${barPct}%`,
                    background: categoryColors[item.category] || '#9CA3AF',
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3-month comparison bar chart */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 4 }}>Monthly Expense Comparison</h3>
        <p style={{ fontSize: 12, color: '#52607A', marginBottom: 16 }}>Income vs expenses across all 3 months</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={summary} barSize={32} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#52607A' }} axisLine={false} tickLine={false} tickFormatter={v => v.split(' ')[0]} />
            <YAxis tick={{ fontSize: 11, fill: '#52607A' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" name="Income" fill="#0B6E6E" radius={[4,4,0,0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#FBBF24" radius={[4,4,0,0]} />
            <Bar dataKey="net" name="Net" fill="#E2F1F0" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
