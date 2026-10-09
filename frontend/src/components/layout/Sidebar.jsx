// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, BrainCircuit, Target,
  PieChart, BarChart2, Settings, LogOut, X,
} from 'lucide-react';
import { logout } from '../../data/mockData';
import { useToast } from '../common/Toast';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions'      },
  { to: '/ai-coach',     icon: BrainCircuit,    label: 'AI Coach'          },
  { to: '/savings',      icon: Target,          label: 'Savings Goals'     },
  { to: '/budgets',      icon: PieChart,        label: 'Budgets'           },
  { to: '/reports',      icon: BarChart2,       label: 'Reports'           },
  { to: '/settings',     icon: Settings,        label: 'Settings'          },
];

export default function Sidebar({ user, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignOut = () => {
    logout();
    toast.info('Signed out successfully.');
    navigate('/login');
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const sidebarContent = (
    <div style={{
      width: 240, background: '#0F1B2D', height: '100%',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#0B6E6E', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -1,
          }}>F</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
            Fin<span style={{ color: '#0B6E6E' }}>Assist</span>
          </span>
        </div>
        {mobileOpen !== undefined && (
          <button
            onClick={onCloseMobile}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              background: isActive ? 'rgba(11,110,110,0.2)' : 'transparent',
              borderLeft: isActive ? '3px solid #0B6E6E' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
              borderRadius: '0 6px 6px 0',
              margin: '1px 8px 1px 0',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} style={{ flexShrink: 0, color: isActive ? '#0B6E6E' : 'inherit' }} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#0B6E6E', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', borderRadius: 6,
            background: 'rgba(180,35,24,0.12)', border: '1px solid rgba(180,35,24,0.25)',
            color: '#ff8a80', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );

  // Mobile overlay
  if (mobileOpen !== undefined) {
    return (
      <>
        {mobileOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.5)',
              zIndex: 998, display: 'flex',
            }}
            onClick={onCloseMobile}
          />
        )}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 999,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}
