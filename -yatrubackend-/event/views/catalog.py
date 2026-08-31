"""Catalogue views: Destinations, Activity types, Packages, Package bookings,
and the account dashboard summary.

All read endpoints are public (`IsAuthenticatedOrReadOnly`); browsing the
catalogue never requires a login. Booking a package and the dashboard require
authentication.
"""

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    ActivityType,
    Booking,
    Destination,
    Favorite,
    Package,
    PackageBooking,
    Review,
)
from ..serializers import (
    ActivityTypeSerializer,
    DestinationDetailSerializer,
    DestinationSerializer,
    PackageBookingSerializer,
    PackageDetailSerializer,
    PackageSerializer,
)


class DestinationListView(generics.ListAPIView):
    queryset = Destination.objects.prefetch_related("activities", "packages")
    serializer_class = DestinationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["region", "is_featured"]
    search_fields = ["name", "region", "tagline"]
    ordering_fields = ["sort_order", "name", "created_at"]


class DestinationDetailView(generics.RetrieveAPIView):
    queryset = Destination.objects.prefetch_related("images", "activities", "packages")
    serializer_class = DestinationDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class ActivityTypeListView(generics.ListAPIView):
    queryset = ActivityType.objects.all()
    serializer_class = ActivityTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class PackageListView(generics.ListAPIView):
    queryset = Package.objects.select_related("destination")
    serializer_class = PackageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["category", "is_featured", "destination"]
    search_fields = ["name", "summary", "description"]
    ordering_fields = ["sort_order", "price", "duration_days", "rating", "created_at"]


class PackageDetailView(generics.RetrieveAPIView):
    queryset = Package.objects.select_related("destination").prefetch_related("images")
    serializer_class = PackageDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class PackageBookingListCreateView(generics.ListCreateAPIView):
    serializer_class = PackageBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status"]

    def get_queryset(self):
        return PackageBooking.objects.filter(user=self.request.user).select_related(
            "package"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DashboardSummaryView(APIView):
    """Counts and short lists for the account dashboard landing page."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        activity_bookings = Booking.objects.filter(user=user).select_related("activity")
        package_bookings = PackageBooking.objects.filter(user=user).select_related(
            "package"
        )

        confirmed = activity_bookings.filter(status="confirmed")
        upcoming = [
            {
                "id": b.id,
                "kind": "activity",
                "title": b.activity.title,
                "date": b.activity.date,
                "status": b.status,
            }
            for b in confirmed.order_by("activity__date")[:5]
        ]
        recent = [
            {
                "id": b.id,
                "kind": "activity",
                "title": b.activity.title,
                "date": b.activity.date,
                "status": b.status,
            }
            for b in activity_bookings.order_by("-booked_at")[:5]
        ]

        return Response(
            {
                "trips": confirmed.count(),
                "favorites": Favorite.objects.filter(user=user).count(),
                "wishlist": Favorite.objects.filter(user=user).count(),
                "reviews": Review.objects.filter(
                    user=user, rated_user__isnull=True
                ).count(),
                "package_bookings": package_bookings.count(),
                "upcoming": upcoming,
                "recent": recent,
            }
        )
