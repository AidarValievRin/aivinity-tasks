import React from 'react';

const PRIORITY_CONFIG = {
  urgent: { label: 'Срочно', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  high: { label: 'Высокий', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  medium: { label: 'Средний', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  low: { label: 'Низкий', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

const STATUS_CONFIG = {
  todo: { label: 'Новая', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
  in_progress: { label: 'В работе', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  on_hold: { label: 'Приостановлена', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  stuck: { label: 'Зависла', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  cancelled: { label: 'Отменена', className: 'bg-gray-600/20 text-gray-500 border border-gray-600/30' },
  done: { label: 'Выполнена', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
};

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}

export function CategoryBadge({ category, color = '#6366f1' }) {
  if (!category) return null;
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {category}
    </span>
  );
}
