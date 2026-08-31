"""Booking, review, favourite, and user-list views."""

from django.contrib.auth.models import User
from rest_framework import generics, permissions

from ..models import Favorite, Review
from ..serializers import (
    BookingSerializer,
    FavoriteSerializer,
    ReviewSerializer,
    UserSerializer,
)
from ..services import BookingService
from ..shared.exceptions import ConflictError, PermissionError_, ValidationError_
from ..shared.permissions import IsOwnerOrReadOnly


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status"]

    def get_queryset(self):
        return BookingService.bookings_for_user(self.request.user)

    def perform_create(self, serializer):
        BookingService.create_booking(self.request.user, serializer)


class BookingDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return BookingService.bookings_for_user(self.request.user)


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Review.objects.select_related("user", "activity", "rated_user")
        activity_id = self.kwargs.get("activity_id")
        if activity_id:
            return queryset.filter(activity_id=activity_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        rated_user_id = self.request.data.get("rated_user")

        if not rated_user_id:
            # A participant reviewing the activity itself.
            serializer.save(user=user)
            return

        # An organiser rating one of their confirmed participants.
        activity = serializer.validated_data.get("activity")
        if activity is None:
            raise ValidationError_("An activity is required to rate a participant.")
        if activity.created_by != user:
            raise PermissionError_("Only the activity organizer can rate participants.")

        try:
            participant = User.objects.get(id=rated_user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            raise ValidationError_("Participant not found.")

        is_confirmed = activity.bookings.filter(
            user=participant, status="confirmed"
        ).exists()
        if not is_confirmed:
            raise ValidationError_(
                "That user is not a confirmed participant in this activity."
            )

        serializer.save(user=user, rated_user=participant)


class FavoriteListCreateView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related(
            "activity"
        )

    def perform_create(self, serializer):
        activity = serializer.validated_data.get("activity")
        if Favorite.objects.filter(user=self.request.user, activity=activity).exists():
            raise ConflictError("Activity already in favorites.")
        serializer.save(user=self.request.user)


class FavoriteDetailView(generics.DestroyAPIView):
    """Removes a favourite addressed by its activity id rather than its own id."""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "activity_id"

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


class UserListView(generics.ListAPIView):
    queryset = User.objects.select_related("profile")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields = ["username", "email"]
