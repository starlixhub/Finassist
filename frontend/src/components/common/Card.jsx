// src/components/common/Card.jsx
import React from 'react';

export default function Card({ children, style = {}, accentColor, padding = 20, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E9',
        borderRadius: 8,
        padding,
        boxShadow: '0 1px 3px rgba(15,27,45,0.08)',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'box-shadow 0.15s' : undefined,
        ...(accentColor ? { borderTop: `3px solid ${accentColor}` } : {}),
        ...style,
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,27,45,0.12)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,27,45,0.08)'; } : undefined}
    >
      {children}
    </div>
  );
}
