// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { isAuthenticated, getUser } from './data/mockData';

// Layout
import AppShell from './components/layout/AppShell';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Application Pages (The 7 primary destinations)
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AICoachPage from './pages/AICoachPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route Guard
function ProtectedRoute({ children, allowIncompleteOnboarding = false }) {
  const authed = isAuthenticated();
  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();
  if (!allowIncompleteOnboarding && !user?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// Public-only Route Guard (redirect to dashboard/onboarding if already logged in)
function PublicRoute({ children }) {
  const authed = isAuthenticated();
  if (authed) {
    const user = getUser();
    return <Navigate to={user?.onboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* First-Time Guided Onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowIncompleteOnboarding={true}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Core Application Shell with 7 Primary Destinations */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/ai-coach" element={<AICoachPage />} />
            <Route path="/savings" element={<SavingsGoalsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  isAuthenticated()
                    ? getUser()?.onboardingComplete
                      ? '/dashboard'
                      : '/onboarding'
                    : '/login'
                }
                replace
              />
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
