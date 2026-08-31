"""Notification serializer."""

from rest_framework import serializers

from ..models import Notification
from .user import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "user", "message", "created_at", "is_read"]
        # The message is authored server-side; a client may only flip `is_read`.
        read_only_fields = ["message", "created_at"]
