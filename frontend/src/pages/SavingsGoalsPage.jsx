// src/pages/SavingsGoalsPage.jsx
import React, { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Select } from '../components/common/Input';
import Modal from '../components/common/Modal';
import { ConfirmModal } from '../components/common/Modal';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import {
  getSavingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
} from '../data/mockData';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';

const CATEGORY_OPTIONS = [
  { value: 'emergency', label: '🛡️ Emergency Fund' },
  { value: 'vacation',  label: '✈️ Vacation'       },
  { value: 'electronics', label: '💻 Electronics'   },
  { value: 'education', label: '📚 Education'       },
  { value: 'vehicle',   label: '🚗 Vehicle'         },
  { value: 'home',      label: '🏠 Home'            },
  { value: 'other',     label: '📦 Other'           },
];

const CATEGORY_ICONS = { emergency: '🛡️', vacation: '✈️', electronics: '💻', education: '📚', vehicle: '🚗', home: '🏠', other: '📦' };

const EMPTY_FORM = { name: '', targetAmount: '', savedAmount: '', targetDate: '', category: 'emergency' };

function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const diff = new Date(targetDate + 'T00:00:00') - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SavingsGoalsPage() {
  const toast = useToast();
  const [goals, setGoals] = useState(() => getSavingsGoals());
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const refresh = () => setGoals(getSavingsGoals());

  const openCreate = () => {
    setEditGoal(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (goal) => {
    setEditGoal(goal);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      savedAmount: String(goal.savedAmount),
      targetDate: goal.targetDate || '',
      category: goal.category || 'other',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Goal name is required.';
    const ta = parseFloat(form.targetAmount);
    if (!form.targetAmount || isNaN(ta) || ta <= 0) e.targetAmount = 'Enter a valid target amount.';
    const sa = parseFloat(form.savedAmount || '0');
    if (isNaN(sa) || sa < 0) e.savedAmount = 'Enter a valid saved amount.';
    if (form.targetDate && new Date(form.targetDate + 'T00:00:00') <= new Date()) e.targetDate = 'Target date must be in the future.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      targetAmount: parseFloat(form.targetAmount),
      savedAmount: parseFloat(form.savedAmount || '0'),
      targetDate: form.targetDate || null,
      category: form.category,
    };
    if (editGoal) {
      updateSavingsGoal(editGoal.id, data);
      toast.success('Goal updated!');
    } else {
      addSavingsGoal(data);
      toast.success('Savings goal created!');
    }
    refresh();
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteSavingsGoal(id);
    refresh();
    toast.success('Goal deleted.');
    setDeleteTarget(null);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary strip */}
      {goals.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Goals', value: goals.length, color: '#0B6E6E' },
            { label: 'Total Saved', value: formatCurrency(totalSaved), color: '#07704A' },
            { label: 'Total Target', value: formatCurrency(totalTarget), color: '#0F1B2D' },
            { label: 'Overall Progress', value: totalTarget > 0 ? `${((totalSaved/totalTarget)*100).toFixed(0)}%` : '0%', color: '#0B6E6E' },
          ].map(item => (
            <Card key={item.label} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#52607A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#52607A' }}>
          {goals.length > 0 ? `${goals.length} active goal${goals.length > 1 ? 's' : ''}` : 'No goals yet'}
        </p>
        <Button onClick={openCreate} icon={<Plus size={15} />}>New Goal</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon="🎯" title="No savings goals yet" message="Create your first savings goal to start tracking your financial milestones." action={openCreate} actionLabel="Create First Goal" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {goals.map(goal => {
            const pct = Math.min(100, goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0);
            const daysLeft = getDaysRemaining(goal.targetDate);
            const remaining = goal.targetAmount - goal.savedAmount;
            return (
              <Card key={goal.id} accentColor="#0B6E6E">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E2F1F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {CATEGORY_ICONS[goal.category] || '📦'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>{goal.name}</div>
                      <div style={{ fontSize: 11, color: '#52607A' }}>Created {formatDate(goal.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(goal)} style={{ background: 'none', border: 'none', color: '#52607A', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(goal)} style={{ background: 'none', border: 'none', color: '#B42318', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#52607A', marginBottom: 1 }}>Saved</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0B6E6E' }}>{formatCurrency(goal.savedAmount)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#52607A', marginBottom: 1 }}>Target</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1B2D' }}>{formatCurrency(goal.targetAmount)}</div>
                  </div>
                </div>

                <ProgressBar value={goal.savedAmount} max={goal.targetAmount} color="#0B6E6E" height={10} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0B6E6E' }}>{pct.toFixed(0)}% complete</span>
                  <span style={{ fontSize: 12, color: '#52607A' }}>{formatCurrency(remaining)} to go</span>
                </div>

                {goal.targetDate && (
                  <div style={{ marginTop: 10, padding: '6px 10px', background: daysLeft < 30 ? '#FEF2F2' : '#F5F7FA', borderRadius: 6 }}>
                    <span style={{ fontSize: 11, color: daysLeft < 30 ? '#B42318' : '#52607A', fontWeight: 600 }}>
                      {daysLeft !== null && daysLeft > 0
                        ? `⏱ ${daysLeft} days remaining (${formatDate(goal.targetDate)})`
                        : daysLeft !== null && daysLeft <= 0
                        ? '⚠️ Target date has passed'
                        : `📅 Target: ${formatDate(goal.targetDate)}`}
                    </span>
                  </div>
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
        title={editGoal ? 'Edit Savings Goal' : 'Create New Goal'}
        width={460}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Goal Name" value={form.name} onChange={set('name')} placeholder="e.g. Emergency Fund" required error={errors.name} />
          <Select
            label="Category"
            value={form.category}
            onChange={set('category')}
            options={CATEGORY_OPTIONS}
            required
          />
          <Input label="Target Amount" type="number" value={form.targetAmount} onChange={set('targetAmount')} prefix="₹" placeholder="150000" required error={errors.targetAmount} />
          <Input label="Currently Saved" type="number" value={form.savedAmount} onChange={set('savedAmount')} prefix="₹" placeholder="0" error={errors.savedAmount} helpText="How much have you already saved towards this goal?" />
          <Input label="Target Date (optional)" type="date" value={form.targetDate} onChange={set('targetDate')} error={errors.targetDate} />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Goal"
        danger
      />
    </div>
  );
}
