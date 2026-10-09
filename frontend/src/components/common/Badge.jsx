// src/components/common/Badge.jsx
import React from 'react';
import { categoryColors, categoryLabels } from '../../utils/formatters';

const PRIORITY_STYLES = {
  high:   { bg: '#FEE2E2', color: '#B42318', label: 'High' },
  medium: { bg: '#FEF3C7', color: '#8F5200', label: 'Medium' },
  low:    { bg: '#D1FAE5', color: '#07704A', label: 'Low' },
};

export function CategoryBadge({ category }) {
  const color = categoryColors[category] || '#9CA3AF';
  const label = categoryLabels[category] || category;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: color + '18',
      color: color,
      border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority = 'medium' }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {s.label}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isIncome = type === 'income';
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: isIncome ? '#D1FAE5' : '#FEE2E2',
      color: isIncome ? '#07704A' : '#B42318',
    }}>
      {isIncome ? 'Income' : 'Expense'}
    </span>
  );
}

export default CategoryBadge;
