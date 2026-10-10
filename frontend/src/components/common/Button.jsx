// src/components/common/Button.jsx
import React from 'react';

const variants = {
  primary: {
    background: '#4A9C5D',
    color: '#FFFFFF',
    border: '1px solid #3D884E',
    boxShadow: 'none',
  },
  accent: {
    background: '#4A9C5D',
    color: '#FFFFFF',
    border: '1px solid #3D884E',
    boxShadow: 'none',
  },
  secondary: {
    background: '#FFFFFF',
    color: '#2D5A34',
    border: '1px solid #D3E2D5',
    boxShadow: 'none',
  },
  danger: {
    background: '#FFFFFF',
    color: '#B91C1C',
    border: '1px solid #FCA5A5',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: '#2D5A34',
    border: '1px solid transparent',
    boxShadow: 'none',
  },
  soft: {
    background: '#E8F0E9',
    color: '#2D5A34',
    border: '1px solid #B0CDB4',
    boxShadow: 'none',
  },
  teal_soft: {
    background: '#E8F0E9',
    color: '#2D5A34',
    border: '1px solid #B0CDB4',
    boxShadow: 'none',
  },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  style: extraStyle = {},
  icon,
  loading = false,
  ...props
}) {
  const v = variants[variant] || variants.primary;

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '6px', minHeight: '30px' },
    md: { padding: '9px 16px', fontSize: '13px', borderRadius: '8px', minHeight: '36px' },
    lg: { padding: '12px 22px', fontSize: '14px', borderRadius: '10px', minHeight: '42px' },
  };

  const sz = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...v,
        ...sz,
        fontFamily: 'inherit',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        justifyContent: 'center',
        transition: 'background 0.15s ease, opacity 0.15s ease, transform 0.05s ease',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        letterSpacing: '-0.01em',
        ...extraStyle,
      }}
      onMouseDown={e => {
        if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.985)';
      }}
      onMouseUp={e => {
        if (!disabled && !loading) e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      {...props}
    >
      {loading ? (
        <span style={{
          width: 14, height: 14, border: '2px solid currentColor',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', display: 'inline-block',
        }} />
      ) : icon}
      {children}
    </button>
  );
}
