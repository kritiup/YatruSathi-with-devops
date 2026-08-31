import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getStoredToken } from '../utils/storage';
import { currentPath } from '../auth/redirect';

/**
 * Guard an authenticated action (e.g. joining an activity).
 *
 * Call the returned function at the top of the handler:
 *   const ensureAuth = useRequireAuth();
 *   const onJoin = () => { if (!ensureAuth()) return; ...proceed... };
 *
 * When the user is not signed in it sends them to /login, remembering the
 * current page so login can bring them straight back. Returns `true` when the
 * user is already authenticated and the action may continue.
 */
export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback((): boolean => {
    if (getStoredToken()) return true;
    navigate('/login', { state: { from: currentPath(location) } });
    return false;
  }, [navigate, location]);
}
