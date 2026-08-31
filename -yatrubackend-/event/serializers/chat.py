"""Chat group and message serializers."""

from rest_framework import serializers

from ..models import Activity, ChatGroup, ChatGroupReadStatus, ChatMessage, Favorite
from .activity import ActivitySerializer
from .user import UserSerializer


class ChatGroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    activity_title = serializers.CharField(source="activity.title", read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatGroup
        fields = [
            "id",
            "activity",
            "activity_title",
            "name",
            "members",
            "created_at",
            "last_message",
            "unread_count",
        ]

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not (request and request.user.is_authenticated):
            return 0

        read_status = ChatGroupReadStatus.objects.filter(
            group=obj, user=request.user
        ).first()
        if read_status:
            return obj.messages.filter(timestamp__gt=read_status.last_read_at).count()
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.order_by("-timestamp").first()
        if not last:
            return None
        return {
            "message": last.message,
            "sender_name": last.sender.username,
            "timestamp": last.timestamp,
        }


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    activity = serializers.PrimaryKeyRelatedField(read_only=True)
    group = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "activity",
            "group",
            "sender",
            "message",
            "timestamp",
            "is_system",
        ]
        # `is_system` marks server-generated notices; clients must not forge it.
        read_only_fields = ["is_system"]

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message must not be empty.")
        return value


class FavoriteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    activity = ActivitySerializer(read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=Activity.objects.all(), source="activity", write_only=True
    )

    class Meta:
        model = Favorite
        fields = ["id", "user", "activity", "activity_id", "created_at"]
