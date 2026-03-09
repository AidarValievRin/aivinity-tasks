import React, { useState } from 'react';
import TaskCard from './TaskCard';
import TaskDetail from './TaskDetail';

const GROUPS = [
  {
    id: 'in_progress',
    label: 'В работе',
    statuses: ['in_progress'],
    color: 'border-blue-500',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'stuck',
    label: 'Зависшие',
    statuses: ['stuck'],
    color: 'border-red-500',
    dotColor: 'bg-red-500',
  },
  {
    id: 'on_hold',
    label: 'Приостановлены',
    statuses: ['on_hold'],
    color: 'border-yellow-500',
    dotColor: 'bg-yellow-500',
  },
  {
    id: 'todo',
    label: 'Ожидают',
    statuses: ['todo'],
    color: 'border-gray-500',
    dotColor: 'bg-gray-500',
  },
  {
    id: 'done',
    label: 'Выполнено',
    statuses: ['done', 'cancelled'],
    color: 'border-green-500',
    dotColor: 'bg-green-500',
  },
];

export default function ListView({ tasks, isTeam = false }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const groups = GROUPS.map((g) => ({
    ...g,
    tasks: tasks.filter((t) => g.statuses.includes(t.status)),
  })).filter((g) => g.tasks.length > 0);

  const toggleGroup = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {groups.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>Нет задач</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.id} className={`border-l-2 ${group.color} pl-4`}>
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${group.dotColor}`} />
              {group.label}
              <span className="text-gray-500">({group.tasks.length})</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${collapsed[group.id] ? '-rotate-90' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {!collapsed[group.id] && (
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDetail
          task={tasks.find((t) => t.id === selectedTask.id) || selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          isTeam={isTeam}
        />
      )}
    </>
  );
}
