import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-14 border-b border-[#2d3148] bg-[#1a1d27] flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#252836] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#6366f1] flex items-center justify-center text-xs font-bold text-white">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-gray-300">{user?.username}</span>
        </Link>
      </div>
    </header>
  );
}
