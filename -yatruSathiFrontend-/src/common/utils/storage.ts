import { STORAGE_KEYS } from '../constants/storage';

/** Thin, typed wrappers over localStorage with JSON handling. */
export const storage = {
  get<T = string>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch {
      /* private mode / quota — ignore */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export interface StoredUser {
  id: number;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

export function getStoredToken(): string | null {
  return storage.get<string>(STORAGE_KEYS.token);
}

export function getStoredUser(): StoredUser | null {
  return storage.get<StoredUser>(STORAGE_KEYS.user);
}

export function clearAuth(): void {
  storage.remove(STORAGE_KEYS.token);
  storage.remove(STORAGE_KEYS.user);
}
