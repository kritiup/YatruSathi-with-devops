import axios, { AxiosError } from 'axios';
import { STORAGE_KEYS } from '../common/constants/storage';
import { ROUTES } from '../common/constants/routes';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'https://yatrusathi-backend.onrender.com/api/';

/** Unified API client: injects the auth token and normalises error payloads. */
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const AUTH_PATHS = new Set<string>([ROUTES.login, ROUTES.signup, '/']);

api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // Redirect to login on an expired/invalid token, except on auth screens.
    if (status === 401 && !AUTH_PATHS.has(window.location.pathname)) {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.location.href = ROUTES.login;
    }

    // Back-compat shim: the backend now returns { error: { code, message } }.
    // Older call sites read `data.error` as a string, so flatten it while
    // keeping the structured form available as `data.errorDetail`.
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data && typeof data === 'object') {
      const err = data.error as { code?: string; message?: string } | string | undefined;
      if (err && typeof err === 'object' && typeof err.message === 'string') {
        data.errorDetail = err;
        data.error = err.message;
        if (typeof err.code === 'string' && data.code === undefined) {
          data.code = err.code;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
