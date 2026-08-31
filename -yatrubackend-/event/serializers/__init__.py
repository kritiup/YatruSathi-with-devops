"""Serializers for the `event` app, grouped by domain.

Re-exported here so `from event.serializers import ActivitySerializer` keeps
working across the api/ modules.
"""

from .activity import ActivityImageSerializer, ActivitySerializer
from .admin import KycRequestSerializer
from .booking import BookingSerializer, ReviewSerializer
from .catalog import (
    ActivityTypeSerializer,
    DestinationDetailSerializer,
    DestinationSerializer,
    PackageBookingSerializer,
    PackageDetailSerializer,
    PackageSerializer,
)
from .chat import ChatGroupSerializer, ChatMessageSerializer, FavoriteSerializer
from .notification import NotificationSerializer
from .user import ProfileSerializer, UserSerializer

__all__ = [
    "ActivityImageSerializer",
    "ActivitySerializer",
    "ActivityTypeSerializer",
    "BookingSerializer",
    "ChatGroupSerializer",
    "ChatMessageSerializer",
    "DestinationDetailSerializer",
    "DestinationSerializer",
    "FavoriteSerializer",
    "KycRequestSerializer",
    "NotificationSerializer",
    "PackageBookingSerializer",
    "PackageDetailSerializer",
    "PackageSerializer",
    "ProfileSerializer",
    "ReviewSerializer",
    "UserSerializer",
]
