"""Booking and review serializers."""

from rest_framework import serializers

from ..models import Activity, Booking, Review
from .activity import ActivitySerializer
from .user import ProfileSerializer, UserSerializer


class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile = ProfileSerializer(source="user.profile", read_only=True)
    activity = ActivitySerializer(read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=Activity.objects.all(), source="activity", write_only=True
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "profile",
            "activity",
            "activity_id",
            "booked_at",
            "status",
            "ticket_count",
        ]
        # Only an organiser may change a booking's status, via the dedicated
        # booking-action endpoint.
        read_only_fields = ["status"]

    def validate_ticket_count(self, value):
        if value < 1:
            raise serializers.ValidationError("Ticket count must be at least 1.")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    rated_user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "activity",
            "rating",
            "comment",
            "created_at",
            "rated_user",
        ]

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
