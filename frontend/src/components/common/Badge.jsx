// src/components/common/Badge.jsx
import React from 'react';
import { categoryColors, categoryLabels } from '../../utils/formatters';

const PRIORITY_STYLES = {
  high:   { bg: '#FEE2E2', color: '#B91C1C', label: 'High' },
  medium: { bg: '#FEF3C7', color: '#B45309', label: 'Medium' },
  low:    { bg: '#DCFCE7', color: '#15803D', label: 'Low' },
};

export function CategoryBadge({ category }) {
  const color = categoryColors[category] || '#64748B';
  const label = categoryLabels[category] || category;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: color + '15',
      color: color,
      border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority = 'medium' }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {s.label}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isIncome = type === 'income';
  return (
    <span style={{
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: isIncome ? '#DCFCE7' : '#FEE2E2',
      color: isIncome ? '#15803D' : '#B91C1C',
      letterSpacing: '-0.01em',
    }}>
      {isIncome ? '+ Income' : '- Expense'}
    </span>
  );
}

export default CategoryBadge;
