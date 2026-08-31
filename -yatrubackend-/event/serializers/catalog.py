"""Serializers for the catalogue: Destinations, Activity types, Packages."""

from decimal import Decimal

from rest_framework import serializers

from ..models import (
    ActivityType,
    Destination,
    DestinationImage,
    Package,
    PackageBooking,
    PackageImage,
)


class DestinationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinationImage
        fields = ["id", "image", "caption", "created_at"]


class ActivityTypeSerializer(serializers.ModelSerializer):
    activity_count = serializers.IntegerField(source="activities.count", read_only=True)

    class Meta:
        model = ActivityType
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "icon",
            "activity_count",
        ]


class DestinationSerializer(serializers.ModelSerializer):
    """List representation — lightweight, for the destinations grid."""

    activity_count = serializers.IntegerField(source="activities.count", read_only=True)
    package_count = serializers.IntegerField(source="packages.count", read_only=True)

    class Meta:
        model = Destination
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "region",
            "cover_image",
            "is_featured",
            "sort_order",
            "activity_count",
            "package_count",
        ]


class DestinationDetailSerializer(DestinationSerializer):
    """Detail representation — adds description, gallery, and nested lists."""

    images = DestinationImageSerializer(many=True, read_only=True)
    activities = serializers.SerializerMethodField()
    packages = serializers.SerializerMethodField()

    class Meta(DestinationSerializer.Meta):
        fields = DestinationSerializer.Meta.fields + [
            "description",
            "images",
            "activities",
            "packages",
            "created_at",
        ]

    def get_activities(self, obj):
        from .activity import ActivitySerializer

        qs = obj.activities.select_related("created_by", "activity_type").all()
        return ActivitySerializer(qs, many=True, context=self.context).data

    def get_packages(self, obj):
        return PackageSerializer(
            obj.packages.all(), many=True, context=self.context
        ).data


class PackageImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageImage
        fields = ["id", "image", "caption", "created_at"]


class PackageSerializer(serializers.ModelSerializer):
    """List representation — for the packages grid and tabs."""

    destination_name = serializers.CharField(
        source="destination.name", read_only=True, default=None
    )

    class Meta:
        model = Package
        fields = [
            "id",
            "name",
            "slug",
            "summary",
            "cover_image",
            "category",
            "duration_days",
            "price",
            "currency",
            "destination_name",
            "rating",
            "review_count",
            "is_featured",
        ]


class PackageDetailSerializer(PackageSerializer):
    images = PackageImageSerializer(many=True, read_only=True)
    destination = serializers.SerializerMethodField()

    class Meta(PackageSerializer.Meta):
        fields = PackageSerializer.Meta.fields + [
            "description",
            "inclusions",
            "exclusions",
            "itinerary",
            "images",
            "destination",
            "created_at",
        ]

    def get_destination(self, obj):
        if not obj.destination_id:
            return None
        return {
            "id": obj.destination.id,
            "name": obj.destination.name,
            "slug": obj.destination.slug,
        }


class PackageBookingSerializer(serializers.ModelSerializer):
    package = PackageSerializer(read_only=True)
    package_id = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(), source="package", write_only=True
    )

    class Meta:
        model = PackageBooking
        fields = [
            "id",
            "package",
            "package_id",
            "participants",
            "start_date",
            "total_price",
            "status",
            "booked_at",
        ]
        # Price is derived from the package; status is set by staff.
        read_only_fields = ["total_price", "status", "booked_at"]

    def validate_participants(self, value):
        if value < 1:
            raise serializers.ValidationError("At least one participant is required.")
        return value

    def create(self, validated_data):
        package = validated_data["package"]
        participants = validated_data.get("participants", 1)
        validated_data["total_price"] = package.price * Decimal(participants)
        return super().create(validated_data)
