// src/components/common/ProgressBar.jsx
import React from 'react';

export default function ProgressBar({
  value,
  max = 100,
  color,
  height = 7,
  showLabel = false,
  animated = true,
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);

  const getColor = () => {
    if (color) return color;
    if (pct >= 90) return '#B91C1C'; /* Danger red */
    if (pct >= 75) return '#B45309'; /* Warning amber */
    return '#15803D';                /* Forest green */
  };

  return (
    <div>
      <div style={{
        height,
        background: '#F1F5F9',
        borderRadius: 999,
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: getColor(),
          borderRadius: 999,
          transition: animated ? 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }} />
      </div>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 5,
          fontSize: 12,
          color: '#64748B',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span>{pct.toFixed(0)}%</span>
          <span style={{ color: getColor(), fontWeight: 600 }}>{pct.toFixed(0)}% used</span>
        </div>
      )}
    </div>
  );
}
