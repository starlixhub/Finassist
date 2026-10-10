// src/components/common/Card.jsx
import React from 'react';

export default function Card({
  children,
  style = {},
  accentColor,
  padding = 20,
  onClick,
  hoverable = false,
}) {
  const isInteractive = Boolean(onClick || hoverable);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border, #E5E0D5)',
        borderRadius: 12,
        padding,
        boxShadow: 'none',
        position: 'relative',
        cursor: isInteractive ? 'pointer' : 'default',
        transition: isInteractive ? 'border-color 0.15s ease, background 0.15s ease' : undefined,
        ...style,
      }}
      onMouseEnter={isInteractive ? e => {
        e.currentTarget.style.borderColor = '#CBD5CD';
      } : undefined}
      onMouseLeave={isInteractive ? e => {
        e.currentTarget.style.borderColor = 'var(--border, #E5E0D5)';
      } : undefined}
    >
      {children}
    </div>
  );
}
