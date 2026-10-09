// src/hooks/useAuth.js
import { useState, useCallback } from 'react';
import { isAuthenticated, login, logout, getUser } from '../data/mockData';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [user, setUser] = useState(() => isAuthenticated() ? getUser() : null);

  const signIn = useCallback((email, password) => {
    const result = login(email, password);
    if (result.success) {
      setAuthenticated(true);
      setUser(result.user);
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
    logout();
    setAuthenticated(false);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    setUser(getUser());
  }, []);

  return { authenticated, user, signIn, signOut, refreshUser };
}
