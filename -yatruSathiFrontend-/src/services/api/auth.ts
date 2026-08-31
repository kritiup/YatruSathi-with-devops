import api from '../../api/api';
import { ENDPOINTS } from '../../common/constants/endpoints';
import { STORAGE_KEYS } from '../../common/constants/storage';
import { clearAuth, getStoredUser, storage } from '../../common/utils/storage';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupPayload {
  username: string;
  email: string;
  password: string;
  [key: string]: unknown;
}

function persistSession(token?: string, user?: unknown) {
  if (token) storage.set(STORAGE_KEYS.token, token);
  if (user) storage.set(STORAGE_KEYS.user, user);
}

/** Authentication and account-recovery API calls. */
export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post(ENDPOINTS.auth.login, credentials);
    persistSession(response.data.token, response.data.user);
    return response.data;
  },

  signup: async (userData: SignupPayload) => {
    const response = await api.post(ENDPOINTS.auth.signup, userData);
    // Old flow returns a token; new flow returns { verification_required, email }.
    persistSession(response.data.token, response.data.user);
    return response.data;
  },

  verifyOtp: async (email: string, code: string) => {
    const response = await api.post(ENDPOINTS.auth.verifyOtp, { email, code });
    persistSession(response.data.token, response.data.user);
    return response.data;
  },

  resendOtp: async (email: string) => {
    const response = await api.post(ENDPOINTS.auth.resendOtp, { email });
    return response.data;
  },

  requestPasswordOtp: async (email: string) => {
    const response = await api.post(ENDPOINTS.auth.forgotPasswordRequestOtp, { email });
    return response.data;
  },

  verifyPasswordOtp: async (email: string, code: string) => {
    const response = await api.post(ENDPOINTS.auth.forgotPasswordVerifyOtp, {
      email,
      code,
    });
    return response.data;
  },

  resetPassword: async (email: string, resetToken: string, newPassword: string) => {
    const response = await api.post(ENDPOINTS.auth.forgotPasswordReset, {
      email,
      reset_token: resetToken,
      new_password: newPassword,
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } finally {
      clearAuth();
    }
  },

  getCurrentUser: () => getStoredUser(),

  isAuthenticated: () => !!storage.get(STORAGE_KEYS.token),
};
