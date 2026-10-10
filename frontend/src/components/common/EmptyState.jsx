// src/components/common/EmptyState.jsx
import React from 'react';
import Button from './Button';

export default function EmptyState({ icon, title, message, action, actionLabel }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
    }}>
      {icon && (
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#F1F0EC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 16, color: '#475569',
        }}>
          {React.isValidElement(icon) ? icon : (typeof icon === 'function' ? React.createElement(icon, { size: 24 }) : icon)}
        </div>
      )}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D', marginBottom: 6 }}>{title}</h3>
      {message && <p style={{ fontSize: 13, color: '#52607A', maxWidth: 320, lineHeight: 1.6 }}>{message}</p>}
      {action && (
        <div style={{ marginTop: 16 }}>
          <Button onClick={action}>{actionLabel || 'Get Started'}</Button>
        </div>
      )}
    </div>
  );
}
