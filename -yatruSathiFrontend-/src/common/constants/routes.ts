/** App route paths. Keep in sync with src/routes.tsx. */
export const ROUTES = {
  login: '/login',
  signup: '/signup',
  verifyOtp: '/verify-otp',
  forgotPassword: '/forgot-password',

  home: '/home',

  // Browse catalogue (public)
  destinations: '/destinations',
  destinationDetail: (slug: string) => `/destinations/${slug}`,
  activities: '/activities',
  activityDetail: (id: number | string) => `/activities/${id}`,
  packages: '/packages',
  packageDetail: (slug: string) => `/packages/${slug}`,
  about: '/about',

  // Create / manage (auth)
  createActivity: '/activities/create',

  // Account dashboard (auth)
  dashboard: '/dashboard',
  myBookings: '/dashboard/bookings',
  myWishlist: '/dashboard/wishlist',
  myReviews: '/dashboard/reviews',
  notifications: '/dashboard/notifications',
  settings: '/dashboard/settings',

  profile: '/user-profile',
  userProfile: (userId: number | string) => `/user-profile/${userId}`,
  chat: '/chatbot',
  aiChat: '/ai-chat',

  adminLogin: '/admin/login',
  adminKyc: '/admin/kyc-approval',
} as const;
