import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import TaskDetail from './TaskDetail';
import CreateTaskModal from './CreateTaskModal';
import { useTaskStore } from '../../store/taskStore';

const MY_COLUMNS = [
  { id: 'todo', label: 'Новые', color: '#6b7280' },
  { id: 'in_progress', label: 'В работе', color: '#3b82f6' },
  { id: 'done', label: 'Выполнено', color: '#22c55e' },
];

const TEAM_COLUMNS = [
  { id: 'todo', label: 'Новые', color: '#6b7280' },
  { id: 'in_progress', label: 'Выполняются', color: '#3b82f6' },
  { id: 'on_hold', label: 'Приостановлены', color: '#eab308' },
  { id: 'stuck', label: 'Зависшие', color: '#ef4444' },
  { id: 'cancelled', label: 'Отменены', color: '#374151' },
];

function SortableTaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ column, tasks, onTaskClick, onAddTask }) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
        <h3 className="text-sm font-medium text-gray-300">{column.label}</h3>
        <span className="text-xs text-gray-600 ml-1">({tasks.length})</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          className="flex-1 space-y-2 min-h-12 rounded-xl p-2 bg-[#1a1d27]/50 border border-[#2d3148]/50"
          data-column-id={column.id}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={() => onAddTask(column.id)}
        className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-[#252836] rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
        </svg>
        Добавить
      </button>
    </div>
  );
}

export default function KanbanBoard({ tasks, isTeam = false, defaultTeamId = null }) {
  const { updateMyTaskStatus, updateTeamTaskStatus } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [createColumnStatus, setCreateColumnStatus] = useState(null);

  const columns = isTeam ? TEAM_COLUMNS : MY_COLUMNS;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const tasksByColumn = useMemo(() => {
    const result = {};
    columns.forEach((col) => {
      result[col.id] = tasks.filter((t) => t.status === col.id);
    });
    return result;
  }, [tasks, columns]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    // Find which column the task was dropped on
    let targetColumnId = null;

    // Check if dropped on a column id directly
    const column = columns.find((c) => c.id === overId);
    if (column) {
      targetColumnId = column.id;
    } else {
      // Dropped on a task - find that task's column
      const targetTask = tasks.find((t) => t.id === overId);
      if (targetTask) {
        targetColumnId = targetTask.status;
      }
    }

    if (!targetColumnId) return;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask || draggedTask.status === targetColumnId) return;

    try {
      if (isTeam) {
        await updateTeamTaskStatus(taskId, targetColumnId);
      } else {
        await updateMyTaskStatus(taskId, targetColumnId);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 overflow-x-auto min-h-full">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] || []}
              onTaskClick={setSelectedTask}
              onAddTask={(status) => setCreateColumnStatus(status)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetail
          task={tasks.find((t) => t.id === selectedTask.id) || selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          isTeam={isTeam}
        />
      )}

      {createColumnStatus !== null && (
        <CreateTaskModal
          isOpen={createColumnStatus !== null}
          onClose={() => setCreateColumnStatus(null)}
          isTeam={isTeam}
          defaultTeamId={defaultTeamId}
        />
      )}
    </>
  );
}
