import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  BotMessageSquare,
  PiggyBank,
  PieChart,
  BarChart3,
  Settings,
  X,
  User
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

const CORE_NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard,   label: 'Dashboard'            },
  { to: '/transactions', icon: ReceiptText,       label: 'Transactions'         },
  { to: '/ai-coach',     icon: BotMessageSquare,  label: 'Finassist AI Coach'   },
  { to: '/savings',      icon: PiggyBank,         label: 'Savings Goal & Plan'  },
];

const ANALYTICS_NAV_ITEMS = [
  { to: '/budgets',      icon: PieChart,          label: 'Budgets & Limits'     },
  { to: '/reports',      icon: BarChart3,         label: 'Reports & Analytics'  },
  { to: '/settings',     icon: Settings,          label: 'Settings & Security'  },
];

export default function Sidebar({ user, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();

  const renderNavLink = ({ to, icon: Icon, label }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onCloseMobile}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: isActive ? 700 : 600,
        color: isActive ? '#FFFFFF' : '#2D5A34',
        background: isActive ? '#4A9C5D' : 'transparent',
        transition: 'background 0.15s ease, color 0.15s ease',
        textDecoration: 'none',
        boxShadow: 'none',
        border: 'none',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.color = '#1E3B24';
          e.currentTarget.style.background = 'rgba(74, 156, 93, 0.12)';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = '#4A9C5D';
        }
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.color = '#2D5A34';
          e.currentTarget.style.background = 'transparent';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = '#B0CDB4';
        }
      }}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            strokeWidth={isActive ? 2.2 : 2.0}
            style={{
              color: isActive ? '#FFFFFF' : '#B0CDB4',
              flexShrink: 0,
              transition: 'color 0.15s ease',
            }}
          />
          <span style={{ letterSpacing: '-0.01em' }}>{label}</span>
        </>
      )}
    </NavLink>
  );

  const sidebarContent = (
    <div style={{
      width: 250,
      background: '#E8F0E9',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid #D3E2D5',
      boxSizing: 'border-box',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '22px 20px 20px',
        borderBottom: '1px solid #D3E2D5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#E8F0E9',
      }}>
        <BrandLogo size={32} showText={true} textColor="#2D5A34" accentColor="#4A9C5D" />
        {mobileOpen !== undefined && (
          <button
            onClick={onCloseMobile}
            className="sidebar-mobile-close-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#2D5A34',
              cursor: 'pointer',
              display: 'none',
              padding: 4,
              borderRadius: 6,
            }}
            aria-label="Close Sidebar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav style={{ flex: 1, padding: '18px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Core Flow */}
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#2D5A34',
          opacity: 0.75,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '6px 12px 6px',
        }}>
          Core Flow
        </div>
        {CORE_NAV_ITEMS.map(renderNavLink)}

        {/* Analytics & System */}
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#2D5A34',
          opacity: 0.75,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '18px 12px 6px',
        }}>
          Insights & System
        </div>
        {ANALYTICS_NAV_ITEMS.map(renderNavLink)}
      </nav>

      {/* User Footer Profile */}
      <div style={{
        padding: '14px 14px',
        borderTop: '1px solid #D3E2D5',
        background: '#E8F0E9',
      }}>
        <button
          onClick={() => navigate('/settings')}
          title="Account Profile & Settings"
          aria-label="Account Profile & Settings"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: '#FFFFFF',
            border: '1px solid #D3E2D5',
            color: '#2D5A34',
            cursor: 'pointer',
            transition: 'background 0.15s ease, border-color 0.15s ease',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#F6FAF7';
            e.currentTarget.style.borderColor = '#B0CDB4';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = '#D3E2D5';
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#4A9C5D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
          }}>
            <User size={15} strokeWidth={2.2} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2D5A34', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Kartik Sharma'}
            </div>
            <div style={{ fontSize: 10, color: '#2D5A34', opacity: 0.75, fontWeight: 500 }}>
              Settings & Prefs
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar-container">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="mobile-sidebar-drawer"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ height: '100%' }}>
            {sidebarContent}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .desktop-sidebar-container { display: flex !important; }
          .mobile-sidebar-drawer { display: none !important; }
        }
        @media (max-width: 768px) {
          .sidebar-mobile-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
