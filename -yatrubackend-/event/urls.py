from django.urls import path

from . import views
from .api.admin_kyc_approve import admin_kyc_approve_api
from .api.admin_kyc_list import admin_kyc_list_api, admin_kyc_stats_api
from .api.admin_login import admin_login_api
from .api.booking_action import booking_action_api
from .api.forgot_password import (
    forgot_password_request_otp_api,
    forgot_password_reset_api,
    forgot_password_verify_otp_api,
)
from .api.login import login_api
from .api.logout import logout_api
from .api.resend_otp import resend_otp_api
from .api.signup import signup_api
from .api.verify_otp import verify_otp_api

urlpatterns = [
    # Root
    path("", views.api_root, name="api-root"),
    # Authentication
    path("auth/login/", login_api, name="login"),
    path("auth/signup/", signup_api, name="signup"),
    path("auth/logout/", logout_api, name="logout"),
    path("auth/verify-otp/", verify_otp_api, name="verify-otp"),
    path("auth/resend-otp/", resend_otp_api, name="resend-otp"),
    # Forgot password
    path(
        "auth/forgot-password/request-otp/",
        forgot_password_request_otp_api,
        name="forgot-password-request-otp",
    ),
    path(
        "auth/forgot-password/verify-otp/",
        forgot_password_verify_otp_api,
        name="forgot-password-verify-otp",
    ),
    path(
        "auth/forgot-password/reset/",
        forgot_password_reset_api,
        name="forgot-password-reset",
    ),
    # Admin
    path("admin/login/", admin_login_api, name="admin-login"),
    path("admin/kyc-requests/", admin_kyc_list_api, name="admin-kyc-list"),
    path("admin/kyc-stats/", admin_kyc_stats_api, name="admin-kyc-stats"),
    path(
        "admin/kyc-requests/<int:profile_id>/",
        admin_kyc_approve_api,
        name="admin-kyc-approve",
    ),
    # Activities
    path(
        "activities/",
        views.ActivityListCreateView.as_view(),
        name="activity-list-create",
    ),
    path(
        "activities/<int:pk>/",
        views.ActivityDetailView.as_view(),
        name="activity-detail",
    ),
    path(
        "activities/<int:activity_id>/reviews/",
        views.ReviewListCreateView.as_view(),
        name="activity-reviews",
    ),
    path(
        "activities/<int:activity_id>/chat/",
        views.ChatMessageListCreateView.as_view(),
        name="activity-chat-message-list-create",
    ),
    # Activities — deprecated `events/` aliases (kept one release for callers
    # migrating to the new paths).
    path(
        "events/",
        views.ActivityListCreateView.as_view(),
        name="event-list-create",
    ),
    path(
        "events/<int:pk>/",
        views.ActivityDetailView.as_view(),
        name="event-detail",
    ),
    path(
        "events/<int:activity_id>/reviews/",
        views.ReviewListCreateView.as_view(),
        name="event-reviews",
    ),
    path(
        "events/<int:activity_id>/chat/",
        views.ChatMessageListCreateView.as_view(),
        name="event-chat-message-list-create",
    ),
    # Catalogue
    path(
        "destinations/",
        views.DestinationListView.as_view(),
        name="destination-list",
    ),
    path(
        "destinations/<slug:slug>/",
        views.DestinationDetailView.as_view(),
        name="destination-detail",
    ),
    path(
        "activity-types/",
        views.ActivityTypeListView.as_view(),
        name="activity-type-list",
    ),
    path("packages/", views.PackageListView.as_view(), name="package-list"),
    path(
        "packages/<slug:slug>/",
        views.PackageDetailView.as_view(),
        name="package-detail",
    ),
    path(
        "package-bookings/",
        views.PackageBookingListCreateView.as_view(),
        name="package-booking-list-create",
    ),
    path(
        "dashboard/summary/",
        views.DashboardSummaryView.as_view(),
        name="dashboard-summary",
    ),
    # Users
    path("users/", views.UserListView.as_view(), name="user-list"),
    path(
        "users/<int:user_id>/profile/",
        views.UserProfileView.as_view(),
        name="user-profile",
    ),
    # Profile
    path("profile/", views.ProfileDetailView.as_view(), name="profile-detail"),
    # Bookings
    path(
        "bookings/", views.BookingListCreateView.as_view(), name="booking-list-create"
    ),
    path(
        "bookings/<int:pk>/", views.BookingDetailView.as_view(), name="booking-detail"
    ),
    path("bookings/<int:pk>/action/", booking_action_api, name="booking-action"),
    # Reviews
    path("reviews/", views.ReviewListCreateView.as_view(), name="review-list"),
    # Favorites
    path(
        "favorites/",
        views.FavoriteListCreateView.as_view(),
        name="favorite-list-create",
    ),
    path(
        "favorites/<int:activity_id>/",
        views.FavoriteDetailView.as_view(),
        name="favorite-detail",
    ),
    # Notifications
    path(
        "notifications/", views.NotificationListView.as_view(), name="notification-list"
    ),
    path(
        "notifications/unread-count/",
        views.unread_notification_count,
        name="unread-notification-count",
    ),
    path(
        "notifications/mark-read/",
        views.mark_notifications_as_read,
        name="mark-notifications-read",
    ),
    path(
        "notifications/<int:pk>/",
        views.NotificationDetailView.as_view(),
        name="notification-detail",
    ),
    # Chat
    path("groups/", views.ChatGroupListView.as_view(), name="chatgroup-list"),
    path(
        "groups/<int:pk>/", views.ChatGroupDetailView.as_view(), name="chatgroup-detail"
    ),
    path(
        "groups/<int:pk>/mark-read/", views.mark_group_as_read, name="group-mark-read"
    ),
    path("groups/<int:pk>/add-member/", views.add_member, name="chatgroup-add-member"),
    path(
        "groups/<int:pk>/remove-member/",
        views.remove_member,
        name="chatgroup-remove-member",
    ),
    path(
        "groups/<int:group_id>/chat/",
        views.ChatMessageListCreateView.as_view(),
        name="group-chat-message-list-create",
    ),
]
