"""Profile reads, KYC submission, and the public profile summary."""

import logging

from django.contrib.auth.models import User
from django.db.models import Avg
from django.utils import timezone

from ..models import Activity, Profile, Review
from ..shared.exceptions import NotFoundError, ValidationError_

logger = logging.getLogger("event")

# Touching any of these fields counts as (re)submitting KYC for review.
KYC_TRIGGER_FIELDS = ("full_name", "document_type", "citizenship_number")
KYC_TRIGGER_FILES = ("document_image", "kyc_photo", "signature")

# How many recent events/reviews a profile summary embeds.
SUMMARY_LIMIT = 5


class ProfileService:
    @staticmethod
    def get_or_create_for_user(user: User) -> Profile:
        profile, _ = Profile.objects.get_or_create(user=user)
        return profile

    @staticmethod
    def get_by_user_id(user_id: int) -> Profile:
        if not User.objects.filter(pk=user_id).exists():
            raise NotFoundError("User not found.")
        profile, _ = Profile.objects.get_or_create(user_id=user_id)
        return profile

    @staticmethod
    def is_kyc_submission(data, files) -> bool:
        return any(field in data for field in KYC_TRIGGER_FIELDS) or any(
            field in files for field in KYC_TRIGGER_FILES
        )

    @staticmethod
    def mark_kyc_submitted(profile: Profile) -> Profile:
        """Reset the profile to 'pending' review after a KYC change."""
        profile.kyc_submitted_at = timezone.now()
        profile.kyc_status = "pending"
        profile.is_kyc_verified = False
        profile.save(
            update_fields=["kyc_submitted_at", "kyc_status", "is_kyc_verified"]
        )
        return profile

    @staticmethod
    def review_kyc(profile_id: int, decision: str) -> Profile:
        """Approve or reject a KYC submission. Called by the admin endpoint."""
        if decision not in ("approved", "rejected"):
            raise ValidationError_('Invalid status. Must be "approved" or "rejected".')
        try:
            profile = Profile.objects.select_related("user").get(id=profile_id)
        except Profile.DoesNotExist:
            raise NotFoundError("Profile not found.")

        profile.kyc_status = decision
        profile.is_kyc_verified = decision == "approved"
        if decision == "approved" and profile.kyc_photo:
            profile.avatar = profile.kyc_photo
        profile.save()
        return profile

    @staticmethod
    def _summary(events_qs, reviews_qs, request, serializers):
        event_serializer, review_serializer = serializers
        average = reviews_qs.aggregate(avg=Avg("rating")).get("avg") or 0
        return {
            "past_events_count": events_qs.count(),
            "past_events": event_serializer(
                events_qs[:SUMMARY_LIMIT], many=True, context={"request": request}
            ).data,
            "reviews_count": reviews_qs.count(),
            "average_rating": round(float(average), 1) if average else 0,
            "reviews": review_serializer(
                reviews_qs[:SUMMARY_LIMIT], many=True, context={"request": request}
            ).data,
        }

    @staticmethod
    def public_summary(profile: Profile, request, serializers) -> dict:
        """Build the organiser/participant activity summary for a profile page."""
        user = profile.user

        organizer_events = Activity.objects.filter(created_by=user, status="completed")
        participant_events = Activity.objects.filter(
            participants=user, status="completed"
        ).exclude(created_by=user)
        organizer_reviews = Review.objects.filter(
            activity__created_by=user
        ).select_related("user", "activity")
        participant_reviews = Review.objects.filter(user=user).select_related(
            "activity"
        )

        return {
            "organizer_summary": ProfileService._summary(
                organizer_events, organizer_reviews, request, serializers
            ),
            "participant_summary": ProfileService._summary(
                participant_events, participant_reviews, request, serializers
            ),
        }
