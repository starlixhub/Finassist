// src/components/common/ProgressBar.jsx
import React from 'react';

export default function ProgressBar({ value, max = 100, color, height = 8, showLabel = false, animated = true }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);

  const getColor = () => {
    if (color) return color;
    if (pct >= 90) return '#B42318';
    if (pct >= 70) return '#8F5200';
    return '#07704A';
  };

  return (
    <div>
      <div style={{
        height,
        background: '#F5F7FA',
        borderRadius: height,
        overflow: 'hidden',
        border: '1px solid #D9E0E9',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: getColor(),
          borderRadius: height,
          transition: animated ? 'width 0.6s ease' : 'none',
        }} />
      </div>
      {showLabel && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 4, fontSize: 11, color: '#52607A',
        }}>
          <span>{pct.toFixed(0)}%</span>
          <span style={{ color: getColor(), fontWeight: 600 }}>{pct.toFixed(0)}% used</span>
        </div>
      )}
    </div>
  );
}
