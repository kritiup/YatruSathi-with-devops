import { createBrowserRouter, Navigate, redirect } from 'react-router';

import { PublicLayout } from './layout/public-layout';
import { AccountLayout } from './layout/account-layout';
import { RequireAuth } from './common/components/RequireAuth';

import { Login } from './pages/login';
import { Signup } from './pages/signup';
import { VerifyOtp } from './pages/verify-otp';
import ForgotPasswordPage from './pages/forgot-password';
import { AdminLogin } from './pages/admin/admin-login';
import { KycApprovalPage } from './pages/admin/kyc-approval';

import { Home } from './pages/home';
import { DestinationsPage } from './pages/destinations';
import { DestinationDetailPage } from './pages/destinations/detail';
import { Events as ActivitiesPage } from './pages/events/events';
import { EventDetails as ActivityDetailsPage } from './pages/events/event-details';
import AddActivityForm from './pages/events/add-event-form';
import { PackagesPage } from './pages/packages';
import { PackageDetailPage } from './pages/packages/detail';
import { AboutPage } from './pages/about';
import { ProfilePage } from './pages/profile/profile-page';
import Chatbox from './pages/chat/chatbox';
import AIChatbot from './pages/chat/aichatbot';

import { DashboardHome } from './pages/dashboard';
import { MyBookings } from './pages/dashboard/bookings';
import { MyWishlist } from './pages/dashboard/wishlist';
import { MyReviews } from './pages/dashboard/reviews';
import { Notification } from './pages/events/notifications';
import SettingsPage from './pages/setting/setting';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/verify-otp', element: <VerifyOtp /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/admin/login', element: <AdminLogin /> },

  // ---------- Public site (top-nav layout) ----------
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'home', element: <Home /> },

      { path: 'destinations', element: <DestinationsPage /> },
      { path: 'destinations/:slug', element: <DestinationDetailPage /> },
      { path: 'activities', element: <ActivitiesPage /> },
      { path: 'activities/:id', element: <ActivityDetailsPage /> },
      { path: 'packages', element: <PackagesPage /> },
      { path: 'packages/:slug', element: <PackageDetailPage /> },
      { path: 'about', element: <AboutPage /> },

      { path: 'user-profile/:userId', element: <ProfilePage /> },

      // Legacy path redirects
      { path: 'events', element: <Navigate to="/activities" replace /> },
      {
        path: 'events/:id',
        loader: ({ params }) => redirect(`/activities/${params.id}`),
      },
      { path: 'favorite', element: <Navigate to="/dashboard/wishlist" replace /> },
      { path: 'my-events', element: <Navigate to="/dashboard/bookings" replace /> },
      { path: 'notification', element: <Navigate to="/dashboard/notifications" replace /> },

      // Requires login — anonymous visitors bounce to /login and come back
      {
        element: <RequireAuth />,
        children: [
          { path: 'activities/create', element: <AddActivityForm /> },
          { path: 'user-profile', element: <ProfilePage /> },
          { path: 'chatbot', element: <Chatbox /> },
          { path: 'ai-chat', element: <AIChatbot /> },
        ],
      },
    ],
  },

  // ---------- Account dashboard (sidebar layout, auth only) ----------
  {
    path: '/dashboard',
    element: <RequireAuth />,
    children: [
      {
        element: <AccountLayout />,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'bookings', element: <MyBookings /> },
          { path: 'wishlist', element: <MyWishlist /> },
          { path: 'reviews', element: <MyReviews /> },
          { path: 'notifications', element: <Notification /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ---------- Admin ----------
  { path: '/admin/kyc-approval', element: <KycApprovalPage defaultTab={0} /> },
  { path: '/admin/kyc-requests', element: <KycApprovalPage defaultTab={1} /> },
  { path: '/admin/settings', element: <KycApprovalPage defaultTab={2} /> },

  { path: '*', element: <Navigate to="/home" replace /> },
]);

export default router;
