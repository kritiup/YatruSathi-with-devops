"""Activity list/detail views."""

import logging

from rest_framework import generics, permissions
from rest_framework.response import Response

from ..models import Activity
from ..serializers import ActivitySerializer, BookingSerializer
from ..services import NotificationService
from ..shared.permissions import IsOwnerOrReadOnly

logger = logging.getLogger("event")

ACTIVITY_QUERYSET = Activity.objects.select_related(
    "created_by", "destination", "activity_type"
).prefetch_related("participants", "images")


class ActivityListCreateView(generics.ListCreateAPIView):
    queryset = ACTIVITY_QUERYSET
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = [
        "category",
        "status",
        "gender_preference",
        "is_free_event",
        "difficulty",
        "destination",
        "activity_type",
    ]
    search_fields = ["title", "description", "location", "tags"]
    ordering_fields = ["date", "created_at", "ticket_price"]
    ordering = ["-date"]

    def perform_create(self, serializer):
        activity = serializer.save(created_by=self.request.user)

        for image in self.request.FILES.getlist("gallery_images"):
            activity.images.create(image=image)

        # Announcing the activity must never fail the creation itself.
        try:
            NotificationService.announce_new_activity(activity)
        except Exception:
            logger.exception(
                "Failed to send new-activity notifications for activity %s",
                activity.id,
            )


class ActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ACTIVITY_QUERYSET
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def retrieve(self, request, *args, **kwargs):
        activity = self.get_object()
        data = self.get_serializer(activity).data

        # The organiser — and only the organiser — also sees who has applied.
        if request.user.is_authenticated and activity.created_by_id == request.user.id:
            bookings = activity.bookings.select_related("user", "activity")
            data["bookings"] = BookingSerializer(
                bookings, many=True, context={"request": request}
            ).data

        return Response(data)
