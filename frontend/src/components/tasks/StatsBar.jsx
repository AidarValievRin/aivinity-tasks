import React, { useMemo } from 'react';
import { isPast, isToday } from 'date-fns';

export default function StatsBar({ tasks }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done' || t.status === 'cancelled') return false;
      return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate));
    }).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, inProgress, done, overdue, progress };
  }, [tasks]);

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-[#1a1d27] border-b border-[#2d3148] flex-wrap">
      <StatItem label="Всего" value={stats.total} color="text-white" />
      <div className="w-px h-4 bg-[#2d3148]" />
      <StatItem label="В работе" value={stats.inProgress} color="text-blue-400" />
      <div className="w-px h-4 bg-[#2d3148]" />
      <StatItem label="Выполнено" value={stats.done} color="text-green-400" />
      <div className="w-px h-4 bg-[#2d3148]" />
      <StatItem label="Просрочено" value={stats.overdue} color="text-red-400" />
      <div className="w-px h-4 bg-[#2d3148]" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Прогресс:</span>
        <div className="w-24 h-1.5 bg-[#252836] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6366f1] rounded-full transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <span className="text-sm text-white font-medium">{stats.progress}%</span>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-gray-400">{label}:</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}
