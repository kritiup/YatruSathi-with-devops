"""Profile views: the caller's own profile, and any user's public profile."""

from rest_framework import generics, permissions
from rest_framework.response import Response

from ..models import Profile
from ..serializers import ActivitySerializer, ProfileSerializer, ReviewSerializer
from ..services import ProfileService


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    """The authenticated user's own profile, including KYC submission."""

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return ProfileService.get_or_create_for_user(self.request.user)

    def perform_update(self, serializer):
        is_kyc_submission = ProfileService.is_kyc_submission(
            self.request.data, self.request.FILES
        )
        profile = serializer.save()
        if is_kyc_submission:
            ProfileService.mark_kyc_submitted(profile)


class UserProfileView(generics.RetrieveAPIView):
    """Another user's profile, plus their organiser/participant summary."""

    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self):
        return ProfileService.get_by_user_id(self.kwargs.get("user_id"))

    def retrieve(self, request, *args, **kwargs):
        profile = self.get_object()
        data = ProfileSerializer(profile, context={"request": request}).data
        data.update(
            ProfileService.public_summary(
                profile, request, (ActivitySerializer, ReviewSerializer)
            )
        )
        return Response(data)
