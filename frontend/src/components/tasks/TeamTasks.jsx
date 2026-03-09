import React, { useState, useMemo } from 'react';
import { useTaskStore } from '../../store/taskStore';
import FilterBar, { applyFilter } from './FilterBar';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import CreateTaskModal from './CreateTaskModal';
import Modal from '../ui/Modal';
import { teamsApi } from '../../api/teams';

function TeamSelectorBar({ teams, selectedTeamId, onSelect }) {
  if (teams.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b border-[#2d3148] bg-[#1a1d27] overflow-x-auto">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
          !selectedTeamId ? 'bg-[#6366f1] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252836]'
        }`}
      >
        Все команды
      </button>
      {teams.map((team) => (
        <button
          key={team.id}
          onClick={() => onSelect(team.id)}
          className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
            selectedTeamId === team.id ? 'bg-[#6366f1] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252836]'
          }`}
        >
          {team.name}
        </button>
      ))}
    </div>
  );
}

function CreateTeamModal({ isOpen, onClose }) {
  const { createTeam } = useTaskStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createTeam(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания команды');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать команду" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Название команды</label>
          <input
            type="text"
            className="input-field"
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Создание...' : 'Создать'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
}

function InviteModal({ isOpen, onClose, teamId }) {
  const { inviteToTeam, fetchTeams } = useTaskStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await inviteToTeam(teamId, code.trim().toUpperCase());
      setSuccess('Участник добавлен!');
      setCode('');
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Пригласить участника" size="sm">
      <div className="p-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{success}</div>
        )}
        <p className="text-sm text-gray-400">
          Введите уникальный код пользователя (AIV-XXXX) для добавления в команду.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            className="input-field font-mono tracking-widest"
            placeholder="AIV-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoFocus
          />
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Закрыть
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default function TeamTasks() {
  const { teamTasks, teams, loading, fetchTeams } = useTaskStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('kanban');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(() => {
    let tasks = teamTasks;
    if (selectedTeamId) {
      tasks = tasks.filter((t) => t.teamId === selectedTeamId);
    }
    return applyFilter(tasks, filter, search);
  }, [teamTasks, filter, search, selectedTeamId]);

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <svg className="opacity-30" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-1">Нет команд</h3>
          <p className="text-gray-400 text-sm">Создайте команду, чтобы начать работать вместе</p>
        </div>
        <button onClick={() => setCreateTeamOpen(true)} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
          Создать команду
        </button>
        <CreateTeamModal
          isOpen={createTeamOpen}
          onClose={() => { setCreateTeamOpen(false); fetchTeams(); }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TeamSelectorBar
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelect={setSelectedTeamId}
      />

      {/* Team actions bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-[#2d3148] bg-[#1a1d27]">
        <button onClick={() => setCreateTeamOpen(true)} className="btn-ghost text-sm py-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
          Новая команда
        </button>
        {selectedTeamId && (
          <button onClick={() => setInviteOpen(true)} className="btn-ghost text-sm py-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" strokeLinecap="round" />
              <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" />
            </svg>
            Пригласить
          </button>
        )}
      </div>

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
        ) : view === 'kanban' ? (
          <KanbanBoard tasks={filtered} isTeam defaultTeamId={selectedTeamId || teams[0]?.id} />
        ) : (
          <ListView tasks={filtered} isTeam />
        )}
      </div>

      <CreateTaskModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        isTeam
        defaultTeamId={selectedTeamId}
      />

      <CreateTeamModal
        isOpen={createTeamOpen}
        onClose={() => { setCreateTeamOpen(false); fetchTeams(); }}
      />

      {inviteOpen && selectedTeamId && (
        <InviteModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          teamId={selectedTeamId}
        />
      )}
    </div>
  );
}
