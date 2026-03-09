import React, { useState, useMemo } from 'react';
import { useTaskStore } from '../../store/taskStore';
import StatsBar from './StatsBar';
import FilterBar, { applyFilter } from './FilterBar';
import ListView from './ListView';
import KanbanBoard from './KanbanBoard';
import CreateTaskModal from './CreateTaskModal';

export default function MyTasks() {
  const { myTasks, loading } = useTaskStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => applyFilter(myTasks, filter, search), [myTasks, filter, search]);

  return (
    <div className="flex flex-col h-full">
      <StatsBar tasks={myTasks} />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        view={view}
        onViewChange={setView}
        onCreateTask={() => setCreateOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full" />
          </div>
        ) : view === 'list' ? (
          <ListView tasks={filtered} isTeam={false} />
        ) : (
          <KanbanBoard tasks={filtered} isTeam={false} />
        )}
      </div>

      <CreateTaskModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        isTeam={false}
      />
    </div>
  );
}
