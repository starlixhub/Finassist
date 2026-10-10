import React, { useState } from 'react';
import {
  Plus, Edit2, Trash2, Shield, Plane, Laptop, GraduationCap,
  Car, Home, Package, Target, Clock, AlertTriangle, Calendar
} from 'lucide-react';
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
import { useCurrency } from '../context/CurrencyContext';

const CATEGORY_OPTIONS = [
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'vacation',  label: 'Vacation'       },
  { value: 'electronics', label: 'Electronics'   },
  { value: 'education', label: 'Education'       },
  { value: 'vehicle',   label: 'Vehicle'         },
  { value: 'home',      label: 'Home'            },
  { value: 'other',     label: 'Other'           },
];

const CATEGORY_ICONS = {
  emergency: Shield,
  vacation: Plane,
  electronics: Laptop,
  education: GraduationCap,
  vehicle: Car,
  home: Home,
  other: Package,
};

const EMPTY_FORM = { name: '', targetAmount: '', savedAmount: '', targetDate: '', category: 'emergency' };

function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const diff = new Date(targetDate + 'T00:00:00') - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SavingsGoalsPage() {
  const toast = useToast();
  const { currency, config, convert, symbol } = useCurrency();
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
      targetAmount: String(convert(goal.targetAmount)),
      savedAmount: String(convert(goal.savedAmount)),
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
    const toInr = (val) => currency === 'INR' ? val : Math.round(val / config.rateFromINR);
    const data = {
      name: form.name.trim(),
      targetAmount: toInr(parseFloat(form.targetAmount)),
      savedAmount: toInr(parseFloat(form.savedAmount || '0')),
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Summary strip */}
      {goals.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Active Goals', value: goals.length, color: '#4D7C0F' },
            { label: 'Total Saved', value: formatCurrency(totalSaved), color: '#15803D' },
            { label: 'Total Target', value: formatCurrency(totalTarget), color: '#0F172A' },
            { label: 'Overall Progress', value: totalTarget > 0 ? `${((totalSaved/totalTarget)*100).toFixed(0)}%` : '0%', color: '#65A30D' },
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

      {/* Header toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          {goals.length > 0 ? `${goals.length} active target milestone${goals.length > 1 ? 's' : ''}` : 'No active targets'}
        </p>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Create Goal</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={<Target size={24} />} title="No savings goals yet" message="Create your first savings target to test mathematical runway feasibility." action={openCreate} actionLabel="Create First Goal" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {goals.map(goal => {
            const pct = Math.min(100, goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0);
            const daysLeft = getDaysRemaining(goal.targetDate);
            const remaining = goal.targetAmount - goal.savedAmount;
            const CategoryIcon = CATEGORY_ICONS[goal.category] || Package;
            return (
              <Card key={goal.id} accentColor="#4D7C0F">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F7FEE7', border: '1px solid #D9F99D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F' }}>
                      <CategoryIcon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{goal.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Created {formatDate(goal.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(goal)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 5, borderRadius: 6 }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(goal)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: 5, borderRadius: 6 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 1 }}>Saved</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#4D7C0F', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(goal.savedAmount)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 1 }}>Target</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>
                </div>

                <ProgressBar value={goal.savedAmount} max={goal.targetAmount} color="#4D7C0F" height={8} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4D7C0F' }}>{pct.toFixed(0)}% achieved</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{formatCurrency(remaining)} remaining</span>
                </div>

                {goal.targetDate && (
                  <div style={{ marginTop: 12, padding: '7px 12px', background: daysLeft < 30 ? '#FEF2F2' : '#F8F7F4', border: `1px solid ${daysLeft < 30 ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: 6 }}>
                    <span style={{ fontSize: 11, color: daysLeft < 30 ? '#B91C1C' : '#475569', fontWeight: 600, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {daysLeft !== null && daysLeft > 0 ? (
                        <>
                          <Clock size={12} /> {daysLeft} days remaining ({formatDate(goal.targetDate)})
                        </>
                      ) : daysLeft !== null && daysLeft <= 0 ? (
                        <>
                          <AlertTriangle size={12} /> Target date reached
                        </>
                      ) : (
                        <>
                          <Calendar size={12} /> Target: {formatDate(goal.targetDate)}
                        </>
                      )}
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
        title={editGoal ? 'Edit Savings Target' : 'Create Savings Milestone'}
        width={460}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Goal Title" value={form.name} onChange={set('name')} placeholder="e.g. Emergency Fund" required error={errors.name} />
          <Select
            label="Category"
            value={form.category}
            onChange={set('category')}
            options={CATEGORY_OPTIONS}
            required
          />
          <Input label="Target Amount" type="number" value={form.targetAmount} onChange={set('targetAmount')} prefix={symbol} placeholder={currency === 'INR' ? '150000' : '1800'} required error={errors.targetAmount} />
          <Input label="Currently Saved" type="number" value={form.savedAmount} onChange={set('savedAmount')} prefix={symbol} placeholder="0" error={errors.savedAmount} helpText="Current funds set aside." />
          <Input label="Target Date (optional)" type="date" value={form.targetDate} onChange={set('targetDate')} error={errors.targetDate} />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Progress tracking will be removed.`}
        confirmLabel="Delete Goal"
        danger
      />
    </div>
  );
}
