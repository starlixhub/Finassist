// src/pages/BudgetsPage.jsx
import React, { useState } from 'react';
import {
  Plus, Edit2, Trash2, AlertCircle, BarChart3, Home, Utensils,
  Car, ShoppingBag, Smartphone, Zap, Package, DollarSign, AlertTriangle, Bell
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Select } from '../components/common/Input';
import Modal from '../components/common/Modal';
import { ConfirmModal } from '../components/common/Modal';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import { getBudgets, addBudget, updateBudget, deleteBudget, getTransactions } from '../data/mockData';
import { getCategoryBreakdown } from '../utils/calculations';
import { formatCurrency, categoryLabels } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import { useCurrency } from '../context/CurrencyContext';

const CATEGORY_ICONS = {
  rent: Home,
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  subscriptions: Smartphone,
  utilities: Zap,
  uncategorized: Package,
  income: DollarSign,
};

const ALL_CATEGORIES = ['rent', 'food', 'transport', 'shopping', 'subscriptions', 'utilities', 'uncategorized'];

const EMPTY_FORM = { category: 'food', limit: '' };

export default function BudgetsPage() {
  const toast = useToast();
  const { currency, config, convert, symbol } = useCurrency();
  const [budgets, setBudgets] = useState(() => getBudgets());
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editBudget, setEditBudget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const transactions = getTransactions();
  const breakdown = getCategoryBreakdown(transactions, 2026, 10);
  const spendMap = {};
  breakdown.forEach(b => { spendMap[b.category] = b.amount; });

  const refresh = () => setBudgets(getBudgets());

  const openCreate = () => {
    setEditBudget(null);
    const usedCats = budgets.map(b => b.category);
    const available = ALL_CATEGORIES.filter(c => !usedCats.includes(c));
    setForm({ category: available[0] || 'food', limit: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (budget) => {
    setEditBudget(budget);
    setForm({ category: budget.category, limit: String(convert(budget.limit)) });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    const l = parseFloat(form.limit);
    if (!form.limit || isNaN(l) || l <= 0) e.limit = 'Enter a valid budget limit.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const toInr = (val) => currency === 'INR' ? val : Math.round(val / config.rateFromINR);
    const data = { category: form.category, limit: toInr(parseFloat(form.limit)), period: 'monthly' };
    if (editBudget) {
      updateBudget(editBudget.id, data);
      toast.success('Budget updated!');
    } else {
      addBudget(data);
      toast.success('Budget created!');
    }
    refresh();
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteBudget(id);
    refresh();
    toast.success('Budget removed.');
    setDeleteTarget(null);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendMap[b.category] || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  const usedCats = budgets.map(b => b.category);
  const availableCats = ALL_CATEGORIES.filter(c => !usedCats.includes(c) || (editBudget && c === editBudget.category));

  const categoryOptions = (editBudget
    ? ALL_CATEGORIES
    : availableCats
  ).map(c => ({ value: c, label: categoryLabels[c] || c }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Summary strip */}
      {budgets.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Budgeted', value: formatCurrency(totalBudget), color: '#0F172A' },
            { label: 'Spent (October)', value: formatCurrency(totalSpent), color: totalSpent > totalBudget ? '#B91C1C' : '#4D7C0F' },
            { label: 'Buffer Remaining', value: formatCurrency(Math.max(0, totalRemaining)), color: totalRemaining >= 0 ? '#15803D' : '#B91C1C' },
          ].map(item => (
            <Card key={item.label} style={{ flex: 1, minWidth: 140, textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums' }}>
                {item.value}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Category allocation for October 2026</p>
        <Button onClick={openCreate} icon={<Plus size={15} />} disabled={availableCats.length === 0}>
          Add Category Limit
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState icon={<BarChart3 size={24} />} title="No budget limits configured" message="Set category limits to track against actual monthly transactions." action={openCreate} actionLabel="Create Budget" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {budgets.map(budget => {
            const spent = spendMap[budget.category] || 0;
            const remaining = budget.limit - spent;
            const pct = (spent / budget.limit) * 100;
            const isOver = pct >= 90;
            const isWarning = pct >= 70 && pct < 90;
            const statusColor = isOver ? '#B91C1C' : isWarning ? '#B45309' : '#15803D';
            const CategoryIcon = CATEGORY_ICONS[budget.category] || Package;

            return (
              <Card key={budget.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#F8F7F4', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F', flexShrink: 0 }}>
                    <CategoryIcon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                        {categoryLabels[budget.category] || budget.category}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {isOver && <AlertCircle size={15} style={{ color: '#B91C1C' }} />}
                        <button onClick={() => openEdit(budget)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 5, borderRadius: 6 }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(budget)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: 5, borderRadius: 6 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>LIMIT</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(budget.limit)}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>SPENT</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: statusColor, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(spent)}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>AVAILABLE</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: remaining < 0 ? '#B91C1C' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                      {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: statusColor, fontVariantNumeric: 'tabular-nums' }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <ProgressBar value={spent} max={budget.limit} height={8} />

                {isOver && (
                  <p style={{ fontSize: 12, color: '#B91C1C', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle size={13} /> Over budget ceiling by {formatCurrency(Math.abs(remaining))}
                  </p>
                )}
                {isWarning && !isOver && (
                  <p style={{ fontSize: 12, color: '#B45309', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Bell size={13} /> Approaching allocation limit — {formatCurrency(remaining)} remaining
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editBudget ? 'Edit Budget' : 'Add Category Limit'}
        width={420}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editBudget ? 'Save Changes' : 'Create Budget'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            label="Category"
            value={form.category}
            onChange={set('category')}
            options={categoryOptions}
            required
            disabled={!!editBudget}
          />
          <Input
            label="Monthly Limit"
            type="number"
            value={form.limit}
            onChange={set('limit')}
            prefix={symbol}
            placeholder={currency === 'INR' ? 'e.g. 8000' : 'e.g. 100'}
            required
            error={errors.limit}
            helpText="Maximum monthly allocation for this expense category."
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="Remove Budget Category"
        message={`Remove the ${categoryLabels[deleteTarget?.category] || ''} budget? You can reconfigure it anytime.`}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
