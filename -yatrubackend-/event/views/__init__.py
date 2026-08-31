"""Views for the `event` app, grouped by domain.

Re-exported so that `from event import views; views.NotificationListView`
keeps working from urls.py.
"""

from .activity import ActivityDetailView, ActivityListCreateView
from .booking import (
    BookingDetailView,
    BookingListCreateView,
    FavoriteDetailView,
    FavoriteListCreateView,
    ReviewListCreateView,
    UserListView,
)
from .catalog import (
    ActivityTypeListView,
    DashboardSummaryView,
    DestinationDetailView,
    DestinationListView,
    PackageBookingListCreateView,
    PackageDetailView,
    PackageListView,
)
from .chat import (
    ChatGroupDetailView,
    ChatGroupListView,
    ChatMessageListCreateView,
    add_member,
    mark_group_as_read,
    remove_member,
)
from .notification import (
    NotificationDetailView,
    NotificationListView,
    mark_notifications_as_read,
    unread_notification_count,
)
from .profile import ProfileDetailView, UserProfileView
from .root import api_root

__all__ = [
    "ActivityDetailView",
    "ActivityListCreateView",
    "ActivityTypeListView",
    "BookingDetailView",
    "BookingListCreateView",
    "ChatGroupDetailView",
    "ChatGroupListView",
    "ChatMessageListCreateView",
    "DashboardSummaryView",
    "DestinationDetailView",
    "DestinationListView",
    "FavoriteDetailView",
    "FavoriteListCreateView",
    "NotificationDetailView",
    "NotificationListView",
    "PackageBookingListCreateView",
    "PackageDetailView",
    "PackageListView",
    "ProfileDetailView",
    "ReviewListCreateView",
    "UserListView",
    "UserProfileView",
    "add_member",
    "api_root",
    "mark_group_as_read",
    "mark_notifications_as_read",
    "remove_member",
    "unread_notification_count",
]
