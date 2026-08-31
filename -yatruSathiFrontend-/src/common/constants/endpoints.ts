/**
 * Backend endpoint paths, relative to the axios `baseURL` (VITE_API_BASE_URL,
 * which already ends in `/api/`). Grouped by domain.
 */
export const ENDPOINTS = {
  auth: {
    login: 'auth/login/',
    signup: 'auth/signup/',
    logout: 'auth/logout/',
    verifyOtp: 'auth/verify-otp/',
    resendOtp: 'auth/resend-otp/',
    forgotPasswordRequestOtp: 'auth/forgot-password/request-otp/',
    forgotPasswordVerifyOtp: 'auth/forgot-password/verify-otp/',
    forgotPasswordReset: 'auth/forgot-password/reset/',
  },
  activities: {
    list: 'activities/',
    detail: (id: number | string) => `activities/${id}/`,
    reviews: (id: number | string) => `activities/${id}/reviews/`,
    chat: (id: number | string) => `activities/${id}/chat/`,
  },
  destinations: {
    list: 'destinations/',
    detail: (slug: string) => `destinations/${slug}/`,
  },
  activityTypes: {
    list: 'activity-types/',
  },
  packages: {
    list: 'packages/',
    detail: (slug: string) => `packages/${slug}/`,
    bookings: 'package-bookings/',
  },
  dashboard: {
    summary: 'dashboard/summary/',
  },
  bookings: {
    list: 'bookings/',
    detail: (id: number | string) => `bookings/${id}/`,
    action: (id: number | string) => `bookings/${id}/action/`,
  },
  favorites: {
    list: 'favorites/',
    detail: (activityId: number | string) => `favorites/${activityId}/`,
  },
  notifications: {
    list: 'notifications/',
    detail: (id: number | string) => `notifications/${id}/`,
    unreadCount: 'notifications/unread-count/',
    markRead: 'notifications/mark-read/',
  },
  groups: {
    list: 'groups/',
    detail: (id: number | string) => `groups/${id}/`,
    chat: (id: number | string) => `groups/${id}/chat/`,
    markRead: (id: number | string) => `groups/${id}/mark-read/`,
    addMember: (id: number | string) => `groups/${id}/add-member/`,
    removeMember: (id: number | string) => `groups/${id}/remove-member/`,
  },
  users: {
    list: 'users/',
    profile: (userId: number | string) => `users/${userId}/profile/`,
  },
  profile: 'profile/',
  reviews: 'reviews/',
  admin: {
    login: 'admin/login/',
    kycRequests: 'admin/kyc-requests/',
    kycStats: 'admin/kyc-stats/',
    kycApprove: (profileId: number | string) => `admin/kyc-requests/${profileId}/`,
  },
} as const;
