// src/components/common/LoadingSpinner.jsx
import React from 'react';

export default function LoadingSpinner({ size = 40, fullPage = false, message }) {
  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: size, height: size,
        border: `3px solid #E2F1F0`,
        borderTop: `3px solid #0B6E6E`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      {message && <p style={{ color: '#52607A', fontSize: 13 }}>{message}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.8)', zIndex: 999,
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      {spinner}
    </div>
  );
}

export function InlineSpinner({ size = 18 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      border: '2px solid #E2F1F0',
      borderTop: '2px solid #0B6E6E',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
