"""Booking lifecycle: request, approve, reject.

Accepting a booking has three side effects that must stay together — the
participant joins the activity, joins its chat group, and is notified — so they
live here rather than in a view.
"""

import logging

from django.contrib.auth.models import User
from django.db import transaction

from ..models import Booking
from ..shared.exceptions import NotFoundError, PermissionError_, ValidationError_
from .chat_service import ChatService
from .notification_service import NotificationService

logger = logging.getLogger("event")

VALID_ACTIONS = {"accept": "confirmed", "reject": "cancelled"}
VALID_STATUSES = {"confirmed", "cancelled", "pending"}


class BookingService:
    @staticmethod
    def get_booking(booking_id: int) -> Booking:
        try:
            return Booking.objects.select_related("activity", "user").get(pk=booking_id)
        except Booking.DoesNotExist:
            raise NotFoundError("Booking not found.")

    @staticmethod
    def create_booking(user: User, serializer) -> Booking:
        booking = serializer.save(user=user)
        NotificationService.notify_booking_requested(booking)
        return booking

    @staticmethod
    def resolve_status(action: str | None, new_status: str | None) -> str:
        """Map the request's `action` or `status` field onto a booking status."""
        if action:
            if action not in VALID_ACTIONS:
                raise ValidationError_('Invalid action. Must be "accept" or "reject".')
            return VALID_ACTIONS[action]
        if new_status in VALID_STATUSES:
            return new_status
        raise ValidationError_("Invalid action or status.")

    @staticmethod
    @transaction.atomic
    def update_status(booking_id: int, actor: User, action=None, new_status=None):
        booking = BookingService.get_booking(booking_id)

        if booking.activity.created_by != actor:
            raise PermissionError_(
                "Only the activity organizer can update booking status."
            )

        booking.status = BookingService.resolve_status(action, new_status)

        if booking.status == "confirmed":
            booking.activity.participants.add(booking.user)
        elif booking.status == "cancelled":
            booking.activity.participants.remove(booking.user)

        booking.save(update_fields=["status"])

        if booking.status == "confirmed":
            group = ChatService.ensure_group_for_activity(booking.activity)
            group.members.add(booking.user)
            ChatService.post_system_message(group, "You are invited into the group.")

        NotificationService.notify_booking_decision(booking)
        return booking

    @staticmethod
    def bookings_for_user(user: User):
        return Booking.objects.filter(user=user).select_related("activity", "user")
