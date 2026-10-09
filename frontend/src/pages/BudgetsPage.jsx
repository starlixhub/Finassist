// src/pages/BudgetsPage.jsx
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
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
import { formatCurrency, categoryLabels, categoryIcons } from '../utils/formatters';
import { useToast } from '../components/common/Toast';

const ALL_CATEGORIES = ['food', 'transport', 'shopping', 'subscriptions', 'utilities', 'rent', 'uncategorized'];

const EMPTY_FORM = { category: 'food', limit: '' };

export default function BudgetsPage() {
  const toast = useToast();
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
    setForm({ category: budget.category, limit: String(budget.limit) });
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
    const data = { category: form.category, limit: parseFloat(form.limit), period: 'monthly' };
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
  ).map(c => ({ value: c, label: `${categoryIcons[c] || '📦'} ${categoryLabels[c] || c}` }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      {budgets.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Budget', value: formatCurrency(totalBudget), color: '#0F1B2D' },
            { label: 'Spent (Oct)', value: formatCurrency(totalSpent), color: '#B42318' },
            { label: 'Remaining', value: formatCurrency(Math.max(0, totalRemaining)), color: totalRemaining >= 0 ? '#07704A' : '#B42318' },
          ].map(item => (
            <Card key={item.label} style={{ flex: 1, minWidth: 130, textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#52607A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#52607A' }}>Budgets for October 2026</p>
        <Button onClick={openCreate} icon={<Plus size={15} />} disabled={availableCats.length === 0}>
          Add Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState icon="📊" title="No budgets set" message="Create spending budgets to track how much you're allocating to each category." action={openCreate} actionLabel="Create First Budget" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgets.map(budget => {
            const spent = spendMap[budget.category] || 0;
            const remaining = budget.limit - spent;
            const pct = (spent / budget.limit) * 100;
            const isOver = pct >= 90;
            const isWarning = pct >= 70 && pct < 90;
            const statusColor = isOver ? '#B42318' : isWarning ? '#8F5200' : '#07704A';

            return (
              <Card key={budget.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {/* Icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {categoryIcons[budget.category] || '📦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>
                        {categoryLabels[budget.category] || budget.category}
                      </span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isOver && <AlertCircle size={14} style={{ color: '#B42318' }} />}
                        <button onClick={() => openEdit(budget)} style={{ background: 'none', border: 'none', color: '#52607A', cursor: 'pointer', padding: 4 }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(budget)} style={{ background: 'none', border: 'none', color: '#B42318', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ fontSize: 10, color: '#52607A', fontWeight: 600, marginBottom: 2 }}>BUDGET</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>{formatCurrency(budget.limit)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ fontSize: 10, color: '#52607A', fontWeight: 600, marginBottom: 2 }}>SPENT</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: statusColor }}>{formatCurrency(spent)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ fontSize: 10, color: '#52607A', fontWeight: 600, marginBottom: 2 }}>REMAINING</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: remaining < 0 ? '#B42318' : '#0F1B2D' }}>
                      {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: statusColor }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>

                <ProgressBar value={spent} max={budget.limit} height={8} />

                {isOver && (
                  <p style={{ fontSize: 11, color: '#B42318', fontWeight: 600, marginTop: 6 }}>
                    ⚠️ Over budget by {formatCurrency(Math.abs(remaining))}
                  </p>
                )}
                {isWarning && !isOver && (
                  <p style={{ fontSize: 11, color: '#8F5200', fontWeight: 600, marginTop: 6 }}>
                    🔔 Approaching budget limit — {formatCurrency(remaining)} remaining
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
        title={editBudget ? 'Edit Budget' : 'Add Budget Category'}
        width={400}
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
            label="Monthly Budget Limit"
            type="number"
            value={form.limit}
            onChange={set('limit')}
            prefix="₹"
            placeholder="e.g. 8000"
            required
            error={errors.limit}
            helpText="Set a spending limit for this category per month."
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="Remove Budget"
        message={`Remove the ${categoryLabels[deleteTarget?.category] || ''} budget? You can always add it back later.`}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
