"""Activity serializers."""

from rest_framework import serializers

from ..models import Activity, ActivityImage, ActivityType, Destination
from .user import UserSerializer


class ActivityImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityImage
        fields = ["id", "image", "created_at"]


class ActivityTypeMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityType
        fields = ["id", "name", "slug"]


class DestinationMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ["id", "name", "slug"]


class ActivitySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    images = ActivityImageSerializer(many=True, read_only=True)
    activity_type = ActivityTypeMiniSerializer(read_only=True)
    destination = DestinationMiniSerializer(read_only=True)
    activity_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ActivityType.objects.all(),
        source="activity_type",
        write_only=True,
        required=False,
        allow_null=True,
    )
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(),
        source="destination",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "date",
            "location",
            "category",
            "image",
            "tags",
            "start_date_time",
            "end_date_time",
            "location_name",
            "map_link",
            "min_participants",
            "max_participants",
            "gender_preference",
            "age_limit",
            "total_expenses",
            "advance_amount",
            "prior_experience_required",
            "is_free_event",
            "ticket_price",
            "pay_on_site",
            "equipment_list",
            "organizer_name",
            "contact_email",
            "phone_number",
            "social_media_link",
            "duration",
            "difficulty",
            "max_altitude",
            "best_season",
            "highlights",
            "destination",
            "destination_id",
            "activity_type",
            "activity_type_id",
            "created_by",
            "participants",
            "images",
            "created_at",
            "updated_at",
            "status",
        ]

    def validate(self, attrs):
        """Reject schedules and participant caps that cannot be satisfied."""
        start = attrs.get("start_date_time")
        end = attrs.get("end_date_time")
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date_time": "End time must not be before the start time."}
            )

        minimum = attrs.get("min_participants")
        maximum = attrs.get("max_participants")
        if minimum is not None and maximum is not None and maximum < minimum:
            raise serializers.ValidationError(
                {
                    "max_participants": (
                        "Maximum participants must not be below the minimum."
                    )
                }
            )
        return attrs
