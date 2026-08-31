"""Models for the `event` app, grouped by domain.

Everything is re-exported here so that `from event.models import Activity`
keeps working and Django's app registry discovers every model.

The app is named `event` for migration-history stability; its core model was
renamed ``Event`` -> ``Activity`` in migration ``0025``.
"""

from .activity import Activity, ActivityImage
from .auth import EmailOTP
from .booking import Booking
from .catalog import (
    ActivityType,
    Destination,
    DestinationImage,
    Package,
    PackageBooking,
    PackageImage,
)
from .chat import ChatGroup, ChatGroupReadStatus, ChatMessage
from .notification import Notification
from .profile import Profile
from .social import Favorite, Review

__all__ = [
    "Activity",
    "ActivityImage",
    "ActivityType",
    "Booking",
    "ChatGroup",
    "ChatGroupReadStatus",
    "ChatMessage",
    "Destination",
    "DestinationImage",
    "EmailOTP",
    "Favorite",
    "Notification",
    "Package",
    "PackageBooking",
    "PackageImage",
    "Profile",
    "Review",
]
