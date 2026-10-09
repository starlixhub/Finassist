// src/pages/SettingsPage.jsx
import React, { useState } from 'react';
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

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 09/10/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO e.g. 2026-10-09)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 10/09/2026)' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = getUser();

  // Profile Form State
  const [profile, setProfile] = useState({
    name: currentUser?.name || 'Kartik Sharma',
    email: currentUser?.email || 'kartik@example.com',
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
    currency: currentUser?.currency || 'INR',
    dateFormat: 'DD/MM/YYYY',
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

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
    await new Promise((r) => setTimeout(r, 500));
    setPasswordSaving(false);
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    toast.success('Password updated in demo session.');
  };

  // Handle Preferences Update
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPrefsSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateUser({ currency: preferences.currency });
    setPrefsSaving(false);
    toast.success('Financial preferences saved.');
  };

  // Handle Demo Reset
  const handleConfirmReset = () => {
    resetData();
    toast.success('Demo data restored to initial state.');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Handle Export Transactions
  const handleExportData = () => {
    const txns = getTransactions();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['date,description,amount,category,type']
        .concat(
          txns.map(
            (t) => `"${t.date}","${t.description.replace(/"/g, '""')}",${t.amount},"${t.category}","${t.type}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
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
    } catch (err) {
      setPingStatus({ ok: false, msg: 'Offline / Cold Start (Fallback Active)' });
      toast.info('Live backend unreachable or sleeping; frontend running standalone mock mode.');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#E2F1F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B6E6E',
          }}>
            <User size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D' }}>Profile Information</h2>
            <p style={{ fontSize: 12, color: '#52607A' }}>Update your personal and primary financial figures</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Input
              label="Display Name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Kartik Sharma"
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
              label="Monthly Income"
              type="number"
              prefix="₹"
              value={profile.monthlyIncome}
              onChange={(e) => setProfile((p) => ({ ...p, monthlyIncome: e.target.value }))}
              placeholder="75000"
              helpText="Used for net cash flow and budget surplus calculations"
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#E2F1F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B6E6E',
          }}>
            <Sliders size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D' }}>Financial Display Preferences</h2>
            <p style={{ fontSize: 12, color: '#52607A' }}>Configure your presentation currency and date formats</p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Select
              label="Operating Currency"
              value={preferences.currency}
              onChange={(e) => setPreferences((p) => ({ ...p, currency: e.target.value }))}
              options={CURRENCY_OPTIONS}
            />
            <Select
              label="Date Display Format"
              value={preferences.dateFormat}
              onChange={(e) => setPreferences((p) => ({ ...p, dateFormat: e.target.value }))}
              options={DATE_FORMAT_OPTIONS}
            />
          </div>

          {/* Currency Guard Notice */}
          <div style={{
            background: '#F5F7FA', border: '1px solid #D9E0E9', borderRadius: 8, padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Globe size={18} style={{ color: '#0B6E6E', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: '#52607A', lineHeight: 1.5 }}>
              <strong style={{ color: '#0F1B2D' }}>Currency Integrity Guard:</strong> FinAssist processes statements in INR by default. To preserve strict financial accuracy, amounts from different currencies are never totaled or combined without a verified, real-time exchange rate contract.
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#E2F1F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B6E6E',
          }}>
            <Shield size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D' }}>Security & Authentication</h2>
            <p style={{ fontSize: 12, color: '#52607A' }}>Manage access credentials and active session</p>
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

          <p style={{ fontSize: 11, color: '#52607A', fontStyle: 'italic' }}>
            Note: In this frontend demo environment, password changes update your local browser session credentials without transmitting credentials to third parties.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Button
              variant="danger"
              onClick={handleSignOut}
              icon={<LogOut size={15} />}
            >
              Sign Out of Session
            </Button>
            <Button type="submit" loading={passwordSaving} icon={<Check size={15} />}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Backend Integration Architecture & Status */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#E2F1F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B6E6E',
          }}>
            <Server size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D' }}>Backend Integration Status</h2>
            <p style={{ fontSize: 12, color: '#52607A' }}>FastAPI + Supabase connection contracts</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', background: '#F5F7FA', borderRadius: 8, border: '1px solid #D9E0E9',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>Render Live Backend Base URL</div>
              <div style={{ fontSize: 12, color: '#52607A', fontFamily: 'monospace' }}>https://finassist-backend.onrender.com/api</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {pingStatus && (
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: pingStatus.ok ? '#07704A' : '#8F5200',
                  padding: '4px 8px', borderRadius: 6,
                  background: pingStatus.ok ? '#E8F5E9' : '#FFF9C4',
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

          <div style={{ fontSize: 12, color: '#52607A', lineHeight: 1.6 }}>
            The frontend uses a clean service architecture layer in <code style={{ color: '#0B6E6E' }}>src/services/</code>. When integrating with your teammate's backend, toggle the mock layer to forward directly to <code style={{ color: '#0B6E6E' }}>POST /api/income</code>, <code style={{ color: '#0B6E6E' }}>POST /api/transactions/upload</code>, <code style={{ color: '#0B6E6E' }}>GET /api/dashboard</code>, <code style={{ color: '#0B6E6E' }}>GET /api/predict</code>, <code style={{ color: '#0B6E6E' }}>POST /api/savings-goal</code>, and <code style={{ color: '#0B6E6E' }}>GET /api/anomaly-spotlight</code>.
          </div>
        </div>
      </Card>

      {/* 5. Data Management */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'rgba(180,35,24,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B42318',
          }}>
            <Database size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D' }}>Demo Data Management</h2>
            <p style={{ fontSize: 12, color: '#52607A' }}>Export your records or reset all items to default state</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', border: '1px solid #D9E0E9', borderRadius: 8,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>Export Dataset (CSV)</div>
              <div style={{ fontSize: 12, color: '#52607A' }}>Download all current transactions as a standard statement CSV file.</div>
            </div>
            <Button variant="secondary" onClick={handleExportData} icon={<Download size={14} />}>
              Export CSV
            </Button>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FFF5F5',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#B42318' }}>Reset Demo Data</div>
              <div style={{ fontSize: 12, color: '#52607A' }}>
                Wipes custom transactions, budget modifications, and restores original sample statement.
              </div>
            </div>
            <Button variant="danger" onClick={() => setResetModalOpen(true)} icon={<RefreshCw size={14} />}>
              Reset Demo Data
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
        message="This action will delete any newly imported transactions, custom category budgets, and savings goals you created, restoring the original 25 demo transactions and baseline figures. This cannot be undone."
        confirmLabel="Yes, Reset Data"
        danger
      />
    </div>
  );
}
