// src/components/layout/AppShell.jsx
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getUser } from '../../data/mockData';

const ROUTE_META = {
  '/dashboard': {
    title: 'Financial Dashboard',
    description: 'Real-time overview of your income, expenses, and savings health',
  },
  '/transactions': {
    title: 'Transactions',
    description: 'Review, search, filter, and import bank statement records',
  },
  '/ai-coach': {
    title: 'AI Financial Coach',
    description: 'Explainable financial observations and data-driven recommendations',
  },
  '/savings': {
    title: 'Savings Goals',
    description: 'Track progress toward your key financial milestones',
  },
  '/budgets': {
    title: 'Budgets & Limits',
    description: 'Monitor category spending thresholds and avoid overspending',
  },
  '/reports': {
    title: 'Reports & Analytics',
    description: 'Multi-month trends, category breakdowns, and savings rate analysis',
  },
  '/settings': {
    title: 'Settings & Preferences',
    description: 'Manage profile, financial preferences, security, and demo data',
  },
};

export default function AppShell({ pageTitle, pageDescription, headerActions }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = getUser();

  const currentMeta = ROUTE_META[location.pathname] || {
    title: pageTitle || 'FinAssist',
    description: pageDescription || '',
  };

  const finalTitle = pageTitle || currentMeta.title;
  const finalDescription = pageDescription || currentMeta.description;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Unified responsive sidebar */}
      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          title={finalTitle}
          description={finalDescription}
          onMenuClick={() => setMobileOpen(true)}
          actions={headerActions}
        />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: '#F5F2EB',
          padding: 24,
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
