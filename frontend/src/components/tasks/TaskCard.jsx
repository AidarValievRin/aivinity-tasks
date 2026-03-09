import React from 'react';
import { format, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PriorityBadge, CategoryBadge } from '../ui/Badge';

function Avatar({ user, size = 'sm' }) {
  if (!user) return null;
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  return (
    <div
      className={`${sizeClass} rounded-full bg-[#6366f1] flex items-center justify-center font-medium text-white flex-shrink-0`}
      title={user.username}
    >
      {user.username[0].toUpperCase()}
    </div>
  );
}

function DueDate({ dueDate, status }) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const overdue = isPast(date) && !isToday(date) && status !== 'done' && status !== 'cancelled';
  const dueSoon = isToday(date);

  return (
    <span
      className={`flex items-center gap-1 text-xs ${
        overdue ? 'text-red-400' : dueSoon ? 'text-yellow-400' : 'text-gray-500'
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
      </svg>
      {format(date, 'd MMM', { locale: ru })}
      {overdue && ' (просрочено)'}
    </span>
  );
}

export default function TaskCard({ task, onClick, isDragging = false }) {
  return (
    <div
      onClick={onClick}
      className={`card p-3 cursor-pointer hover:border-[#6366f1]/50 transition-all duration-150 group ${
        isDragging ? 'opacity-50 rotate-1 scale-105' : ''
      } ${task.status === 'done' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className={`text-sm font-medium text-white leading-snug group-hover:text-[#818cf8] transition-colors ${
            task.status === 'done' ? 'line-through text-gray-400' : ''
          }`}
        >
          {task.title}
        </h3>
        {task.status === 'done' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <PriorityBadge priority={task.priority} />
        {task.category && <CategoryBadge category={task.category} />}
      </div>

      <div className="flex items-center justify-between">
        <DueDate dueDate={task.dueDate} status={task.status} />

        <div className="flex items-center gap-1.5 ml-auto">
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {task.comments.length}
            </span>
          )}
          {task.assignee && <Avatar user={task.assignee} />}
        </div>
      </div>
    </div>
  );
}
