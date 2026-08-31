import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import api from '../../api/api';
import { notificationService } from '../../services/api/notification';
import { chatService } from '../../services/api/chat';
import { getStoredToken, getStoredUser, clearAuth } from '../utils/storage';
import { currentPath } from '../auth/redirect';

interface ChatGroupLike {
  unread_count?: number;
}

/**
 * Shared state for the app chrome (both the public top bar and the account
 * sidebar): the current user, their avatar, unread badge counts, and the
 * login / logout navigation helpers.
 *
 * Counts refresh on every route change — there is no realtime channel any
 * more now that the backend runs on SQLite.
 */
export function useHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => getStoredUser());
  const [avatar, setAvatar] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  useEffect(() => {
    if (!getStoredToken()) {
      setAvatar('');
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }
    let cancelled = false;

    api
      .get('profile/')
      .then(r => {
        if (!cancelled && r.data?.avatar) setAvatar(r.data.avatar);
      })
      .catch(() => undefined);

    Promise.all([
      notificationService.getUnreadCount().catch(() => 0),
      chatService.getChatGroups().catch(() => [] as ChatGroupLike[]),
    ]).then(([notifCount, groups]) => {
      if (cancelled) return;
      setUnreadNotifications(notifCount);
      setUnreadMessages(
        (groups as ChatGroupLike[]).reduce((acc, g) => acc + (g.unread_count || 0), 0)
      );
    });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const goToLogin = useCallback(
    () => navigate('/login', { state: { from: currentPath(location) } }),
    [navigate, location]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('auth/logout/');
    } catch {
      /* best effort */
    } finally {
      clearAuth();
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  return {
    user,
    avatar,
    unreadNotifications,
    unreadMessages,
    isAuthenticated: !!getStoredToken(),
    goToLogin,
    logout,
  };
}
