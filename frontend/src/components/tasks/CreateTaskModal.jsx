import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useTaskStore } from '../../store/taskStore';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочно' },
];

export default function CreateTaskModal({ isOpen, onClose, isTeam = false, defaultTeamId = null }) {
  const { createMyTask, createTeamTask, categories, teams } = useTaskStore();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    dueDate: '',
    teamId: defaultTeamId || '',
    assigneeId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTeam = teams.find((t) => t.id === form.teamId);
  const teamMembers = selectedTeam?.members?.map((m) => m.user) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Заголовок обязателен');
      return;
    }
    if (isTeam && !form.teamId) {
      setError('Выберите команду');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        category: form.category || undefined,
        dueDate: form.dueDate || undefined,
        assigneeId: form.assigneeId || undefined,
        teamId: form.teamId || undefined,
      };

      if (isTeam) {
        await createTeamTask(data);
      } else {
        await createMyTask(data);
      }

      setForm({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        dueDate: '',
        teamId: defaultTeamId || '',
        assigneeId: '',
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isTeam ? 'Создать командную задачу' : 'Создать задачу'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Заголовок <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Название задачи"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Описание</label>
          <textarea
            className="input-field min-h-20 resize-y"
            placeholder="Описание задачи..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Приоритет</label>
            <select
              className="input-field"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Срок</label>
            <input
              type="date"
              className="input-field"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Категория</label>
          <input
            type="text"
            className="input-field"
            placeholder="Категория"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            list="create-category-list"
          />
          <datalist id="create-category-list">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        {isTeam && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Команда <span className="text-red-400">*</span>
              </label>
              <select
                className="input-field"
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value, assigneeId: '' })}
              >
                <option value="">Выберите команду</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {form.teamId && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Ответственный</label>
                <select
                  className="input-field"
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                >
                  <option value="">Не назначен</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Создание...
              </span>
            ) : (
              'Создать задачу'
            )}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
}
