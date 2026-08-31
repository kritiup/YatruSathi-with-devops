"""Notification views."""

from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..models import Notification
from ..serializers import NotificationSerializer
from ..services import NotificationService
from ..shared.permissions import IsOwnerOrReadOnly


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["is_read"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def unread_notification_count(request):
    return Response({"count": NotificationService.unread_count(request.user)})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_as_read(request):
    updated = NotificationService.mark_all_read(request.user)
    return Response({"status": "success", "updated": updated})
