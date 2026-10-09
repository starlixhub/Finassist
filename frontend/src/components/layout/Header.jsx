// src/components/layout/Header.jsx
import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ title, description, onMenuClick, actions }) {
  const today = new Date('2026-10-09').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #D9E0E9',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="mobile-menu-btn"
        style={{
          display: 'none',
          background: 'none', border: 'none', color: '#0F1B2D',
          cursor: 'pointer', padding: 4,
        }}
      >
        <Menu size={22} />
      </button>

      {/* Title area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F1B2D', lineHeight: 1.2 }}>{title}</h1>
        {description && <p style={{ fontSize: 12, color: '#52607A', marginTop: 1 }}>{description}</p>}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 12, color: '#52607A',
          background: '#F5F7FA', padding: '4px 10px',
          borderRadius: 20, border: '1px solid #D9E0E9',
          whiteSpace: 'nowrap',
        }}>
          {today}
        </span>
        {actions}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
