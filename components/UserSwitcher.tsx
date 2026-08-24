'use client';

import React from 'react';
import { useCurrentUser } from '@/context/UserContext';
import { SeedUser } from '@/lib/constants/users';

export const UserSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers } = useCurrentUser();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = availableUsers.find((u) => u.id === e.target.value);
    if (selected) {
      setCurrentUser(selected);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-100/80 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
      <label htmlFor="user-switcher-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
        User:
      </label>
      <select
        id="user-switcher-select"
        value={currentUser.id}
        onChange={handleChange}
        className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer pr-1"
        aria-label="Switch User Account"
      >
        {availableUsers.map((user: SeedUser) => (
          <option key={user.id} value={user.id} className="text-slate-900 bg-white font-medium py-1">
            {user.name} ({user.email.split('@')[0]})
          </option>
        ))}
      </select>
    </div>
  );
};
