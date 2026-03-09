import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';

export default function Sidebar({ activeTab, onTabChange }) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { teams } = useTaskStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-[#1a1d27] border-r border-[#2d3148] transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[#2d3148]">
        <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-semibold text-white text-sm truncate">AiVinity Tasks</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => onTabChange('my')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
            activeTab === 'my'
              ? 'bg-[#6366f1]/20 text-[#6366f1]'
              : 'text-gray-400 hover:text-white hover:bg-[#252836]'
          }`}
          title="Мои задачи"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed && <span className="text-sm font-medium">Мои задачи</span>}
        </button>

        <button
          onClick={() => onTabChange('team')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
            activeTab === 'team'
              ? 'bg-[#6366f1]/20 text-[#6366f1]'
              : 'text-gray-400 hover:text-white hover:bg-[#252836]'
          }`}
          title="Командные задачи"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed && <span className="text-sm font-medium">Командные</span>}
        </button>

        {!collapsed && teams.length > 0 && (
          <div className="pt-2">
            <p className="px-3 text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Команды</p>
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252836] cursor-pointer transition-colors"
                onClick={() => onTabChange('team')}
              >
                <div className="w-5 h-5 rounded bg-[#6366f1]/30 flex items-center justify-center text-xs text-[#6366f1] font-medium flex-shrink-0">
                  {team.name[0].toUpperCase()}
                </div>
                <span className="text-sm truncate">{team.name}</span>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Profile */}
      <div className="p-3 border-t border-[#2d3148]">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252836] transition-colors"
          title="Профиль"
        >
          <div className="w-7 h-7 rounded-full bg-[#6366f1] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.uniqueCode}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
