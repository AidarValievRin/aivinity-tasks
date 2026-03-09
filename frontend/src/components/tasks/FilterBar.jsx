import React from 'react';
import { isPast, isToday } from 'date-fns';

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'urgent', label: 'Высокий приоритет' },
  { id: 'active', label: 'Активные' },
  { id: 'today', label: 'Сегодня' },
  { id: 'overdue', label: 'Просроченные' },
];

export default function FilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  view,
  onViewChange,
  onCreateTask,
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-[#2d3148] bg-[#1a1d27] flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-48 max-w-80">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          type="text"
          className="input-field pl-9 py-1.5 text-sm"
          placeholder="Поиск задач..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.id
                ? 'bg-[#6366f1] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#252836]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center bg-[#252836] rounded-lg p-1">
          <button
            onClick={() => onViewChange('list')}
            className={`p-1.5 rounded transition-colors ${
              view === 'list' ? 'bg-[#1a1d27] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Список"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
              <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" />
              <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" />
              <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => onViewChange('kanban')}
            className={`p-1.5 rounded transition-colors ${
              view === 'kanban' ? 'bg-[#1a1d27] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Kanban"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="12" rx="1" />
              <rect x="17" y="3" width="5" height="15" rx="1" />
            </svg>
          </button>
        </div>

        {/* Create button */}
        <button onClick={onCreateTask} className="btn-primary text-sm py-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Создать задачу
        </button>
      </div>
    </div>
  );
}

export function applyFilter(tasks, filter, search) {
  let result = [...tasks];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  switch (filter) {
    case 'urgent':
      result = result.filter((t) => t.priority === 'urgent' || t.priority === 'high');
      break;
    case 'active':
      result = result.filter((t) => ['todo', 'in_progress', 'on_hold', 'stuck'].includes(t.status));
      break;
    case 'today':
      result = result.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));
      break;
    case 'overdue':
      result = result.filter((t) => {
        if (!t.dueDate || t.status === 'done' || t.status === 'cancelled') return false;
        return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate));
      });
      break;
    default:
      break;
  }

  return result;
}
