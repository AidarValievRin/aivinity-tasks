import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Modal from '../ui/Modal';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'on_hold', label: 'Приостановлена' },
  { value: 'stuck', label: 'Зависла' },
  { value: 'cancelled', label: 'Отменена' },
  { value: 'done', label: 'Выполнена' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочно' },
];

export default function TaskDetail({ task, isOpen, onClose, isTeam = false }) {
  const { user } = useAuthStore();
  const {
    updateMyTask,
    deleteMyTask,
    addMyTaskComment,
    updateTeamTask,
    deleteTeamTask,
    addTeamTaskComment,
    categories,
    teams,
  } = useTaskStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        category: task.category || '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        assigneeId: task.assigneeId || '',
      });
    }
  }, [task]);

  if (!task) return null;

  const teamMembers = isTeam
    ? teams.find((t) => t.id === task.teamId)?.members?.map((m) => m.user) || []
    : [];

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
        category: form.category || null,
      };

      if (isTeam) {
        await updateTeamTask(task.id, data);
      } else {
        await updateMyTask(task.id, data);
      }
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      if (isTeam) {
        await updateTeamTask(task.id, { status });
      } else {
        await updateMyTask(task.id, { status });
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm('Удалить задачу?')) return;
    setDeleting(true);
    try {
      if (isTeam) {
        await deleteTeamTask(task.id);
      } else {
        await deleteMyTask(task.id);
      }
      onClose();
    } catch {} finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      if (isTeam) {
        await addTeamTaskComment(task.id, comment.trim());
      } else {
        await addMyTaskComment(task.id, comment.trim());
      }
      setComment('');
    } catch {} finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editing ? (
              <input
                className="input-field text-lg font-semibold"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            ) : (
              <h2
                className="text-lg font-semibold text-white cursor-pointer hover:text-[#818cf8] transition-colors"
                onClick={() => setEditing(true)}
              >
                {task.title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-1.5">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-1.5">
                  Отмена
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-ghost text-sm py-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Редактировать
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Удалить
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Статус</label>
            <select
              className="input-field text-sm"
              value={editing ? form.status : task.status}
              onChange={(e) => editing ? setForm({ ...form, status: e.target.value }) : handleStatusChange(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Приоритет</label>
            {editing ? (
              <select
                className="input-field text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            ) : (
              <div className="pt-1">
                <PriorityBadge priority={task.priority} />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Категория</label>
            {editing ? (
              <input
                className="input-field text-sm"
                placeholder="Категория"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="category-list"
              />
            ) : (
              <p className="text-sm text-gray-300">{task.category || '—'}</p>
            )}
            <datalist id="category-list">
              {categories.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Срок</label>
            {editing ? (
              <input
                type="date"
                className="input-field text-sm"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-300">
                {task.dueDate ? format(new Date(task.dueDate), 'd MMMM yyyy', { locale: ru }) : '—'}
              </p>
            )}
          </div>

          {/* Assignee */}
          {isTeam && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Ответственный</label>
              {editing ? (
                <select
                  className="input-field text-sm"
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                >
                  <option value="">Не назначен</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-300">{task.assignee?.username || '—'}</p>
              )}
            </div>
          )}

          {/* Owner */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Создатель</label>
            <p className="text-sm text-gray-300">{task.owner?.username}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Описание</label>
          {editing ? (
            <textarea
              className="input-field text-sm min-h-24 resize-y"
              placeholder="Описание задачи..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-300 whitespace-pre-wrap min-h-8">
              {task.description || <span className="text-gray-500 italic">Нет описания</span>}
            </p>
          )}
        </div>

        {/* Watchers */}
        {task.watchers?.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Наблюдатели</label>
            <div className="flex items-center gap-2">
              {task.watchers.map((w) => (
                <div
                  key={w.id}
                  className="w-7 h-7 rounded-full bg-[#252836] border border-[#2d3148] flex items-center justify-center text-xs text-gray-300"
                  title={w.username}
                >
                  {w.username[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex gap-6 pt-2 border-t border-[#2d3148]">
          <div>
            <p className="text-xs text-gray-500">Создана</p>
            <p className="text-xs text-gray-400">
              {format(new Date(task.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Обновлена</p>
            <p className="text-xs text-gray-400">
              {format(new Date(task.updatedAt), 'd MMM yyyy, HH:mm', { locale: ru })}
            </p>
          </div>
        </div>

        {/* Comments */}
        <div className="border-t border-[#2d3148] pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Комментарии ({task.comments?.length || 0})
          </h3>

          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {task.comments?.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#252836] border border-[#2d3148] flex items-center justify-center text-xs text-gray-300 flex-shrink-0">
                  {c.user.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-300">{c.user.username}</span>
                    <span className="text-xs text-gray-600">
                      {format(new Date(c.createdAt), 'd MMM, HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{c.content}</p>
                </div>
              </div>
            ))}
            {(!task.comments || task.comments.length === 0) && (
              <p className="text-sm text-gray-600 italic">Нет комментариев</p>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              className="input-field text-sm flex-1"
              placeholder="Добавить комментарий..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              disabled={submittingComment || !comment.trim()}
              className="btn-primary text-sm py-1.5"
            >
              {submittingComment ? '...' : 'Отправить'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
