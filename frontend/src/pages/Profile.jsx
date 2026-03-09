import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const copyCode = () => {
    navigator.clipboard.writeText(user.uniqueCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkTelegram = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    setLinking(true);
    try {
      const res = await api.put('/users/telegram', { telegramId });
      updateUser({ telegramId: res.data.user.telegramId });
      setLinkSuccess('Telegram успешно привязан!');
      setTelegramId('');
    } catch (err) {
      setLinkError(err.response?.data?.error || 'Ошибка привязки');
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f1117] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/tasks')}
            className="btn-ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Назад
          </button>
          <h1 className="text-xl font-semibold text-white">Профиль</h1>
        </div>

        <div className="space-y-6">
          {/* User info */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Информация об аккаунте</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#6366f1] flex items-center justify-center text-2xl font-bold text-white">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-lg">{user?.username}</p>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Имя пользователя</p>
                <p className="text-white">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="text-white">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Unique code */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-white mb-2">Уникальный код</h2>
            <p className="text-gray-400 text-sm mb-4">
              Этот код используется для приглашения в команды и привязки Telegram.
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#252836] border border-[#2d3148] rounded-lg px-4 py-3 font-mono text-lg text-[#6366f1] tracking-widest">
                {user?.uniqueCode}
              </div>
              <button
                onClick={copyCode}
                className="btn-secondary"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Скопировано
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Копировать
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Telegram */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-white mb-2">Telegram</h2>

            {user?.telegramId ? (
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-green-400 font-medium">Telegram привязан</p>
                  <p className="text-gray-400 text-sm">ID: {user.telegramId}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-[#252836] border border-[#2d3148] rounded-lg text-sm text-gray-400">
                  <p className="font-medium text-gray-300 mb-2">Как привязать Telegram:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Откройте нашего Telegram бота</li>
                    <li>Отправьте команду /link</li>
                    <li>Введите ваш код: <span className="font-mono text-[#6366f1]">{user?.uniqueCode}</span></li>
                  </ol>
                </div>

                <p className="text-sm text-gray-400 mb-3">Или введите ваш Telegram ID вручную:</p>

                {linkError && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {linkError}
                  </div>
                )}
                {linkSuccess && (
                  <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    {linkSuccess}
                  </div>
                )}

                <form onSubmit={handleLinkTelegram} className="flex gap-3">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Telegram ID (числовой)"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={linking} className="btn-primary whitespace-nowrap">
                    {linking ? 'Привязка...' : 'Привязать'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Logout */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Выход</h2>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
