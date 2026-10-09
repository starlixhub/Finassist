// src/components/common/Button.jsx
import React from 'react';

const variants = {
  primary: {
    background: '#0B6E6E',
    color: '#fff',
    border: '1px solid #0B6E6E',
  },
  secondary: {
    background: '#fff',
    color: '#0F1B2D',
    border: '1px solid #D9E0E9',
  },
  danger: {
    background: '#fff',
    color: '#B42318',
    border: '1px solid #B42318',
  },
  ghost: {
    background: 'transparent',
    color: '#52607A',
    border: '1px solid transparent',
  },
  teal_soft: {
    background: '#E2F1F0',
    color: '#0B6E6E',
    border: '1px solid #E2F1F0',
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
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '5px' },
    md: { padding: '8px 16px', fontSize: '13px', borderRadius: '6px' },
    lg: { padding: '11px 22px', fontSize: '14px', borderRadius: '7px' },
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
        gap: 6,
        width: fullWidth ? '100%' : 'auto',
        justifyContent: 'center',
        transition: 'opacity 0.15s, box-shadow 0.15s',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...extraStyle,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) e.currentTarget.style.opacity = '0.85';
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) e.currentTarget.style.opacity = '1';
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
