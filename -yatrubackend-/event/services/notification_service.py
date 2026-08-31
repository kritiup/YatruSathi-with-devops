"""Creating and reading notifications.

Every notification in the app is created through this service so that the
message wording lives in one place.
"""

import logging

from django.contrib.auth.models import User

from ..models import Notification

logger = logging.getLogger("event")


class NotificationService:
    @staticmethod
    def notify(user: User, message: str) -> Notification:
        return Notification.objects.create(user=user, message=message)

    @staticmethod
    def notify_many(users, message: str) -> int:
        """Send the same message to many users in a single query.

        Returns the number of notifications created.
        """
        notifications = [Notification(user=user, message=message) for user in users]
        if not notifications:
            return 0
        Notification.objects.bulk_create(notifications)
        return len(notifications)

    @staticmethod
    def announce_new_activity(activity) -> int:
        """Tell everyone except the organiser that a new activity was published."""
        recipients = User.objects.exclude(id=activity.created_by_id)
        message = (
            f"New activity created: {activity.title} by "
            f"{activity.created_by.username}. Check it out!"
        )
        return NotificationService.notify_many(recipients, message)

    @staticmethod
    def notify_booking_requested(booking) -> Notification:
        return NotificationService.notify(
            booking.activity.created_by,
            f'"{booking.user.username}" has requested to join your activity '
            f'"{booking.activity.title}". Please review the request.',
        )

    @staticmethod
    def notify_booking_decision(booking) -> Notification:
        if booking.status == "confirmed":
            message = (
                f"{booking.activity.created_by.username} accepted your booking for "
                f"'{booking.activity.title}' and added you to the group chat."
            )
        elif booking.status == "cancelled":
            message = f"Your booking for '{booking.activity.title}' has been rejected."
        else:
            message = (
                f"Your booking status for '{booking.activity.title}' was updated to "
                f"{booking.status}."
            )
        return NotificationService.notify(booking.user, message)

    @staticmethod
    def notify_group_message(message_obj) -> int:
        """Notify every group member except the sender about a new message."""
        group = message_obj.group
        recipients = group.members.exclude(id=message_obj.sender_id)
        text = (
            f"New message from {message_obj.sender.username} in {group.name}: "
            f"{message_obj.message[:50]}"
        )
        return NotificationService.notify_many(recipients, text)

    @staticmethod
    def unread_count(user: User) -> int:
        return Notification.objects.filter(user=user, is_read=False).count()

    @staticmethod
    def mark_all_read(user: User) -> int:
        return Notification.objects.filter(user=user, is_read=False).update(
            is_read=True
        )
