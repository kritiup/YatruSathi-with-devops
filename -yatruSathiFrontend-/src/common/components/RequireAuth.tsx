import { Navigate, Outlet, useLocation } from 'react-router';
import { getStoredToken } from '../utils/storage';
import { currentPath } from '../auth/redirect';

/**
 * Route guard for pages that require a signed-in user.
 *
 * Public pages (Home, event browsing, an event's detail page) are never
 * wrapped in this. Protected child routes are grouped under a single
 * `<RequireAuth />` element in the router. Anonymous visitors are sent to
 * /login with the attempted path remembered, so login returns them here.
 */
export const RequireAuth: React.FC = () => {
  const location = useLocation();

  if (!getStoredToken()) {
    return <Navigate to="/login" replace state={{ from: currentPath(location) }} />;
  }
  return <Outlet />;
};

export default RequireAuth;
