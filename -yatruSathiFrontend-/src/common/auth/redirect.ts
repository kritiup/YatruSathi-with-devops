import type { Location } from 'react-router';

/** Router state we attach when sending someone to the login page. */
export interface FromState {
  from?: string;
}

/** The path (with query) to return to after a successful login. */
export function currentPath(location: Pick<Location, 'pathname' | 'search'>): string {
  return `${location.pathname}${location.search || ''}`;
}

/** Read the post-login redirect target from router state, defaulting to Home. */
export function redirectTarget(state: unknown, fallback = '/home'): string {
  const from = (state as FromState | null)?.from;
  return typeof from === 'string' && from.startsWith('/') ? from : fallback;
}
