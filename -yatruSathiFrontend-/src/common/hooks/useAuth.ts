import { useCallback, useEffect, useState } from 'react';
import api from '../../api/api';
import { ENDPOINTS } from '../constants/endpoints';
import { STORAGE_KEYS } from '../constants/storage';
import { clearAuth, getStoredUser, storage, type StoredUser } from '../utils/storage';

const AUTH_EVENT = 'yatrusathi:auth-changed';

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/**
 * Authentication state and actions, backed by localStorage.
 *
 * Works without a provider: every `useAuth()` instance stays in sync via a
 * window event, and across tabs via the native `storage` event.
 */
export function useAuth() {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const persist = useCallback((token: string | undefined, nextUser: StoredUser | undefined) => {
    if (token) storage.set(STORAGE_KEYS.token, token);
    if (nextUser) storage.set(STORAGE_KEYS.user, nextUser);
    setUser(nextUser ?? getStoredUser());
    emitAuthChange();
  }, []);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const { data } = await api.post(ENDPOINTS.auth.login, credentials);
      persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      const { data } = await api.post(ENDPOINTS.auth.verifyOtp, { email, code });
      if (data.token) persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } finally {
      clearAuth();
      setUser(null);
      emitAuthChange();
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user && !!storage.get(STORAGE_KEYS.token),
    login,
    verifyOtp,
    logout,
    setSession: persist,
  };
}
