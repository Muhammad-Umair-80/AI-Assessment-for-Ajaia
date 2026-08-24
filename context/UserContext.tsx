'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SeedUser, SEEDED_USERS } from '@/lib/constants/users';

interface UserContextType {
  currentUser: SeedUser;
  setCurrentUser: (user: SeedUser) => void;
  availableUsers: SeedUser[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ajaia_current_user_id';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<SeedUser>(SEEDED_USERS[0]); // Default: Muhammad Umair
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedUserId = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedUserId) {
        const found = SEEDED_USERS.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUserState(found);
        }
      }
    } catch (e) {
      console.warn('Failed to read current user from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const setCurrentUser = (user: SeedUser) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, user.id);
    } catch (e) {
      console.warn('Failed to save current user to localStorage:', e);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers: SEEDED_USERS,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useCurrentUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
}
