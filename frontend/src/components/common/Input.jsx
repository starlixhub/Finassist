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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#52607A', letterSpacing: '0.03em' }}>
          {label} {required && <span style={{ color: '#B42318' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 10, color: '#52607A', fontSize: 14, pointerEvents: 'none',
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
            padding: `9px ${suffix || isPassword ? 36 : 12}px 9px ${prefix ? 28 : 12}px`,
            border: `1px solid ${error ? '#B42318' : '#D9E0E9'}`,
            borderRadius: 6,
            fontSize: 13,
            color: '#0F1B2D',
            background: disabled ? '#F5F7FA' : '#fff',
            outline: 'none',
            transition: 'border-color 0.15s',
            ...inputStyle,
          }}
          onFocus={e => { e.target.style.borderColor = error ? '#B42318' : '#0B6E6E'; }}
          onBlur={e => { e.target.style.borderColor = error ? '#B42318' : '#D9E0E9'; }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            style={{
              position: 'absolute', right: 10, background: 'none', border: 'none',
              color: '#52607A', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center',
            }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {suffix && !isPassword && (
          <span style={{ position: 'absolute', right: 10, color: '#52607A', fontSize: 13, pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: 11, color: '#B42318' }}>{error}</span>}
      {helpText && !error && <span style={{ fontSize: 11, color: '#52607A' }}>{helpText}</span>}
    </div>
  );
}

export function Select({ label, value, onChange, options = [], error, required, style = {}, disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#52607A', letterSpacing: '0.03em' }}>
          {label} {required && <span style={{ color: '#B42318' }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: `1px solid ${error ? '#B42318' : '#D9E0E9'}`,
          borderRadius: 6,
          fontSize: 13,
          color: '#0F1B2D',
          background: '#fff',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 11, color: '#B42318' }}>{error}</span>}
    </div>
  );
}
