import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, UNAUTHORIZED_EVENT } from '../api/client.js';

const AuthContext = createContext(null);

export const AUTH_ERRORS = {
  0: 'Cannot reach the server. Check your connection and try again.',
  401: 'Incorrect username or password.',
  403: 'This account is inactive.',
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/auth/me/')
      .then((data) => { if (active) setUser(data); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (identifier, password) => {
    const data = await api.post('/auth/login/', { username: identifier, password });
    setUser(data);
    return data;
  }, []);

  const signUp = useCallback(async (payload) => {
    const data = await api.post('/auth/register/', payload);
    setUser(data);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout/', {});
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const value = useMemo(() => ({
    user,
    checking,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
  }), [user, checking, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
