"""Organiser accepts or rejects a booking request."""

from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..serializers import BookingSerializer
from ..services import BookingService


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def booking_action_api(request, pk):
    """Update a booking's status. Only the event organizer may call this.

    Body: {"action": "accept" | "reject"} or {"status": "confirmed" |
    "cancelled" | "pending"}.

    Accepting also adds the user to the event and its chat group, posts a
    system message, and notifies them — see BookingService.update_status.
    """
    booking = BookingService.update_status(
        booking_id=pk,
        actor=request.user,
        action=request.data.get("action"),
        new_status=request.data.get("status"),
    )
    serializer = BookingSerializer(booking, context={"request": request})
    return Response(serializer.data)
