// src/components/common/Input.jsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  prefix,
  suffix,
  style = {},
  inputStyle = {},
  disabled = false,
  helpText,
  ...props
}) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && (
        <label style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#334155',
          letterSpacing: '-0.01em',
        }}>
          {label} {required && <span style={{ color: '#B91C1C' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{
            position: 'absolute',
            left: 12,
            color: '#64748B',
            fontSize: 14,
            pointerEvents: 'none',
          }}>
            {prefix}
          </span>
        )}
        <input
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: `10px ${suffix || isPassword ? 38 : 14}px 10px ${prefix ? 30 : 14}px`,
            border: `1px solid ${error ? '#B91C1C' : '#CBD5E1'}`,
            borderRadius: 8,
            fontSize: 13,
            color: '#0F172A',
            background: disabled ? '#F8FAFC' : '#FFFFFF',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            fontFamily: 'inherit',
            ...inputStyle,
          }}
          onFocus={e => {
            e.target.style.borderColor = error ? '#B91C1C' : '#65A30D';
            e.target.style.boxShadow = error
              ? '0 0 0 3px rgba(185, 28, 28, 0.12)'
              : '0 0 0 3px rgba(101, 163, 13, 0.15)';
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? '#B91C1C' : '#CBD5E1';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            style={{
              position: 'absolute',
              right: 10,
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Toggle password visibility"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {suffix && !isPassword && (
          <span style={{
            position: 'absolute',
            right: 12,
            color: '#64748B',
            fontSize: 13,
            pointerEvents: 'none',
          }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: 11, fontWeight: 500, color: '#B91C1C' }}>{error}</span>}
      {helpText && !error && <span style={{ fontSize: 11, color: '#64748B' }}>{helpText}</span>}
    </div>
  );
}

export function Select({ label, value, onChange, options = [], error, required, style = {}, disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && (
        <label style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#334155',
          letterSpacing: '-0.01em',
        }}>
          {label} {required && <span style={{ color: '#B91C1C' }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: `1px solid ${error ? '#B91C1C' : '#CBD5E1'}`,
          borderRadius: 8,
          fontSize: 13,
          color: '#0F172A',
          background: '#FFFFFF',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={e => {
          e.target.style.borderColor = error ? '#B91C1C' : '#65A30D';
          e.target.style.boxShadow = '0 0 0 3px rgba(101, 163, 13, 0.15)';
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? '#B91C1C' : '#CBD5E1';
          e.target.style.boxShadow = 'none';
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 11, fontWeight: 500, color: '#B91C1C' }}>{error}</span>}
    </div>
  );
}
