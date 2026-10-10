// src/components/common/BrandLogo.jsx
import React from 'react';

/**
 * Clean minimal flat geometric logo mark
 * Colors:
 * - Dark Green: #2D5A34
 * - Solid Bright Green: #4A9C5D
 * - Soft Sage Accent: #B0CDB4
 */
export function BrandIcon({ size = 30, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Finassist Logo Mark"
    >
      {/* Flat stack of cards/fintech layers */}
      <rect x="12" y="60" width="76" height="24" rx="7" fill="#2D5A34" />
      <rect x="20" y="38" width="68" height="22" rx="7" fill="#3D7A47" />
      <rect x="28" y="16" width="60" height="22" rx="7" fill="#4A9C5D" />
      <circle cx="42" cy="27" r="4.5" fill="#E8F0E9" />
    </svg>
  );
}

export default function BrandLogo({ size = 30, showText = true, textColor = '#2D5A34', accentColor = '#4A9C5D' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <BrandIcon size={size} />
      {showText && (
        <span style={{
          fontSize: Math.max(17, Math.round(size * 0.68)),
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.025em',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
          lineHeight: 1,
        }}>
          Fin<span style={{ color: accentColor }}>assist</span>
        </span>
      )}
    </div>
  );
}
