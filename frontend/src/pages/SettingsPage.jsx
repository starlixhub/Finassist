// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Shield, Sliders, Database, Download, RefreshCw, Check, LogOut, Globe, Server
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input, { Select } from '../components/common/Input';
import { ConfirmModal } from '../components/common/Modal';
import { getUser, updateUser, resetData, logout, getTransactions } from '../data/mockData';
import { useToast } from '../components/common/Toast';
import { useCurrency } from '../context/CurrencyContext';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee (Base Currency)' },
  { value: 'USD', label: 'USD ($) - US Dollar (1 USD ≈ ₹83.3)' },
  { value: 'EUR', label: 'EUR (€) - Euro (1 EUR ≈ ₹90.9)' },
  { value: 'GBP', label: 'GBP (£) - British Pound (1 GBP ≈ ₹106.0)' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 09/10/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO e.g. 2026-10-09)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 10/09/2026)' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { currency: activeCurrency, setCurrency: setActiveCurrencyState, symbol } = useCurrency();
  const currentUser = getUser();

  // Profile Form State
  const [profile, setProfile] = useState({
    name: currentUser?.name || 'Kartik Unhale',
    email: currentUser?.email || 'demo@finassist.in',
    monthlyIncome: String(currentUser?.monthlyIncome || 75000),
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState({
    currency: activeCurrency || currentUser?.currency || 'INR',
    dateFormat: 'DD/MM/YYYY',
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Keep preferences in sync if activeCurrency changes from header
  useEffect(() => {
    setPreferences((prev) => ({ ...prev, currency: activeCurrency }));
  }, [activeCurrency]);

  // Backend test state
  const [pingStatus, setPingStatus] = useState(null);
  const [pinging, setPinging] = useState(false);

  // Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const incomeNum = parseFloat(profile.monthlyIncome);
    if (!profile.name.trim()) {
      toast.error('Please provide a display name.');
      return;
    }
    if (!incomeNum || incomeNum <= 0) {
      toast.error('Please enter a valid monthly income.');
      return;
    }

    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateUser({
      name: profile.name.trim(),
      email: profile.email.trim(),
      monthlyIncome: incomeNum,
    });
    setProfileSaving(false);
    toast.success('Profile updated successfully.');
  };

  // Handle Password Update
  const handleSavePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!passwords.currentPassword) errors.currentPassword = 'Enter your current password.';
    if (!passwords.newPassword || passwords.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters.';
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setPasswordSaving(false);
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    toast.success('Password updated successfully.');
  };

  // Handle Preferences
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPrefsSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    updateUser({ currency: preferences.currency });
    setActiveCurrencyState(preferences.currency);
    setPrefsSaving(false);
    toast.success(`Display preferences updated: Switched to ${preferences.currency}.`);
  };

  // Reset Demo Data
  const handleConfirmReset = () => {
    resetData();
    toast.success('Demo environment reset to baseline 25 transactions.');
    setResetModalOpen(false);
  };

  // Export CSV
  const handleExportData = () => {
    const txns = getTransactions();
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
    const rows = txns.map((t) => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finassist_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to CSV.');
  };

  // Test live backend connectivity
  const testBackendConnection = async () => {
    setPinging(true);
    setPingStatus(null);
    try {
      const res = await fetch('https://finassist-backend.onrender.com/health', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setPingStatus({ ok: true, msg: `Online (${data.status || 'healthy'})` });
        toast.success('Render backend responded: Healthy');
      } else {
        setPingStatus({ ok: false, msg: `Status ${res.status}` });
        toast.warning(`Backend responded with status ${res.status}`);
      }
    } catch {
      setPingStatus({ ok: false, msg: 'Offline / Standalone Active' });
      toast.info('Live backend unreachable; running standalone local mode.');
    } finally {
      setPinging(false);
    }
  };

  const handleSignOut = () => {
    logout();
    toast.info('Signed out successfully.');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* 1. Profile Section */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: '#F7FEE7',
            border: '1px solid #D9F99D',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F',
          }}>
            <User size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Profile Information</h2>
            <p style={{ fontSize: 12, color: '#64748B' }}>Personal credentials and baseline take-home income</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Input
              label="Display Name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Kartik Unhale"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. kartik@example.com"
              required
            />
            <Input
              label="Monthly Income (INR Baseline)"
              type="number"
              prefix="₹"
              value={profile.monthlyIncome}
              onChange={(e) => setProfile((p) => ({ ...p, monthlyIncome: e.target.value }))}
              placeholder="75000"
              helpText="Baseline ledger figure in INR. Automatically converted across all views based on active currency."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="submit" loading={profileSaving} icon={<Check size={15} />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Financial Preferences */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: '#F7FEE7',
            border: '1px solid #D9F99D',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F',
          }}>
            <Sliders size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Display Preferences</h2>
            <p style={{ fontSize: 12, color: '#64748B' }}>Currency display and date formatting rules</p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Select
              label="Operating Currency"
              value={preferences.currency}
              onChange={(e) => {
                const nextCurr = e.target.value;
                setPreferences((p) => ({ ...p, currency: nextCurr }));
                setActiveCurrencyState(nextCurr);
                toast.success(`Currency switched to ${nextCurr}. Figures dynamically converted.`);
              }}
              options={CURRENCY_OPTIONS}
            />
            <Select
              label="Date Display Format"
              value={preferences.dateFormat}
              onChange={(e) => setPreferences((p) => ({ ...p, dateFormat: e.target.value }))}
              options={DATE_FORMAT_OPTIONS}
            />
          </div>

          <div style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Globe size={18} style={{ color: '#4D7C0F', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.55, margin: 0 }}>
              <strong style={{ color: '#0F172A' }}>Live Multi-Currency Conversion:</strong> Finassist automatically converts all financial records in real-time across INR (₹), USD ($), EUR (€), and GBP (£). Both the currency symbol and underlying figures are converted dynamically using institutional exchange rates.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="submit" loading={prefsSaving} icon={<Check size={15} />}>
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Security Section */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: '#F7FEE7',
            border: '1px solid #D9F99D',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F',
          }}>
            <Shield size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Security & Authentication</h2>
            <p style={{ fontSize: 12, color: '#64748B' }}>Password credentials and active user session</p>
          </div>
        </div>

        <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Input
              label="Current Password"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              error={passwordErrors.currentPassword}
            />
            <Input
              label="New Password"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="••••••••"
              error={passwordErrors.newPassword}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              error={passwordErrors.confirmPassword}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Button
              variant="danger"
              onClick={handleSignOut}
              icon={<LogOut size={15} />}
            >
              Sign Out
            </Button>
            <Button type="submit" loading={passwordSaving} icon={<Check size={15} />}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Backend Health Check */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: '#F7FEE7',
            border: '1px solid #D9F99D',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F',
          }}>
            <Server size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Backend Connectivity</h2>
            <p style={{ fontSize: 12, color: '#64748B' }}>FastAPI + Supabase Render deployment endpoints</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>FastAPI Live Endpoint</div>
              <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>https://finassist-backend.onrender.com/api</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {pingStatus && (
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: pingStatus.ok ? '#15803D' : '#B45309',
                  padding: '4px 9px', borderRadius: 6,
                  background: pingStatus.ok ? '#DCFCE7' : '#FEF3C7',
                }}>
                  {pingStatus.msg}
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={testBackendConnection}
                loading={pinging}
                icon={<RefreshCw size={13} />}
              >
                Ping Health
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Data Management */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C',
          }}>
            <Database size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Data Management</h2>
            <p style={{ fontSize: 12, color: '#64748B' }}>Export ledger records or restore original test scenario</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', border: '1px solid #E2E8F0', borderRadius: 8,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Export Ledger (CSV)</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Download current transaction statement as a CSV document.</div>
            </div>
            <Button variant="secondary" onClick={handleExportData} icon={<Download size={14} />}>
              Export CSV
            </Button>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FEF2F2',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C' }}>Reset Demo Scenario</div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                Restores original 25 transactions and anomaly test data.
              </div>
            </div>
            <Button variant="danger" onClick={() => setResetModalOpen(true)} icon={<RefreshCw size={14} />}>
              Reset Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Demo Data to Initial State?"
        message="This action will restore the original demo transactions and baseline figures. Any uploaded CSV statements will be cleared."
        confirmLabel="Yes, Reset Data"
        danger
      />
    </div>
  );
}
