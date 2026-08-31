"""End-to-end checks over the refactored API surface.

These cover the behaviour the refactor changed: the paginated list shape, the
error envelope, the new permission rules, and the booking side effects.
"""

import pytest

pytestmark = pytest.mark.django_db


class TestListShape:
    def test_activities_list_is_a_bare_list_without_page_param(self, api, activity):
        """Back-compat: no `page` param means the old plain-array response."""
        response = api.get("/api/activities/")
        assert response.status_code == 200
        assert isinstance(response.data, list)
        assert response.data[0]["title"] == activity.title

    def test_activities_list_is_paginated_with_page_param(self, api, activity):
        response = api.get("/api/activities/?page=1")
        assert response.status_code == 200
        assert set(response.data) >= {"count", "next", "previous", "results"}
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == activity.title

    def test_page_size_is_capped(self, api, activity):
        response = api.get("/api/activities/?page=1&page_size=5000")
        assert response.status_code == 200
        assert len(response.data["results"]) <= 100

    def test_events_alias_still_serves_activities(self, api, activity):
        """The deprecated /api/events/ path proxies the activities view."""
        response = api.get("/api/events/")
        assert response.status_code == 200
        assert response.data[0]["title"] == activity.title


class TestErrorEnvelope:
    def test_not_found_uses_envelope(self, as_participant):
        response = as_participant.get("/api/notifications/999999/")
        assert response.status_code == 404
        assert response.data["error"]["code"] == "not_found"
        assert isinstance(response.data["error"]["message"], str)

    def test_unauthenticated_read_of_private_list_is_rejected(self, api):
        response = api.get("/api/bookings/")
        assert response.status_code in (401, 403)
        assert "error" in response.data


class TestProfilePermissions:
    def test_user_cannot_self_approve_kyc(self, as_participant, participant):
        """kyc_status is read-only, so a self-approval attempt is ignored."""
        response = as_participant.patch(
            "/api/profile/", {"kyc_status": "approved", "bio": "hi"}, format="json"
        )
        assert response.status_code == 200
        participant.profile.refresh_from_db()
        assert participant.profile.kyc_status == "pending"
        assert participant.profile.is_kyc_verified is False
        assert participant.profile.bio == "hi"

    def test_kyc_submission_stamps_submitted_at(self, as_participant, participant):
        response = as_participant.patch(
            "/api/profile/", {"full_name": "Test Person"}, format="json"
        )
        assert response.status_code == 200
        participant.profile.refresh_from_db()
        assert participant.profile.kyc_submitted_at is not None
        assert participant.profile.kyc_status == "pending"


class TestBookings:
    def test_user_cannot_self_confirm_booking(self, as_participant, booking):
        """status is read-only on the serializer; only the action endpoint sets it."""
        as_participant.patch(
            f"/api/bookings/{booking.id}/", {"status": "confirmed"}, format="json"
        )
        booking.refresh_from_db()
        assert booking.status == "pending"

    def test_organizer_accepts_booking_and_group_is_created(
        self, as_organizer, booking, activity, participant
    ):
        response = as_organizer.patch(
            f"/api/bookings/{booking.id}/action/", {"action": "accept"}, format="json"
        )
        assert response.status_code == 200

        booking.refresh_from_db()
        assert booking.status == "confirmed"
        assert participant in activity.participants.all()

        group = activity.chat_group
        assert participant in group.members.all()
        assert activity.created_by in group.members.all()
        assert group.messages.filter(is_system=True).exists()
        assert participant.notifications.exists()

    def test_outsider_cannot_action_a_booking(self, as_outsider, booking):
        response = as_outsider.patch(
            f"/api/bookings/{booking.id}/action/", {"action": "accept"}, format="json"
        )
        assert response.status_code == 403
        booking.refresh_from_db()
        assert booking.status == "pending"


class TestReviews:
    def test_non_organizer_cannot_rate_a_participant(
        self, as_outsider, activity, participant
    ):
        """Previously this path raised a TypeError and returned a 500."""
        response = as_outsider.post(
            "/api/reviews/",
            {
                "activity": activity.id,
                "rating": 5,
                "comment": "nice",
                "rated_user": participant.id,
            },
            format="json",
        )
        assert response.status_code == 403
        assert response.data["error"]["code"] == "permission_denied"

    def test_organizer_cannot_rate_unconfirmed_participant(
        self, as_organizer, activity, participant, booking
    ):
        response = as_organizer.post(
            "/api/reviews/",
            {
                "activity": activity.id,
                "rating": 5,
                "comment": "nice",
                "rated_user": participant.id,
            },
            format="json",
        )
        assert response.status_code == 400

    def test_rating_out_of_range_is_rejected(self, as_participant, activity):
        response = as_participant.post(
            "/api/reviews/",
            {"activity": activity.id, "rating": 99, "comment": "x"},
            format="json",
        )
        assert response.status_code == 400


class TestFavorites:
    def test_duplicate_favorite_returns_conflict(self, as_participant, activity):
        first = as_participant.post(
            "/api/favorites/", {"activity_id": activity.id}, format="json"
        )
        assert first.status_code == 201

        second = as_participant.post(
            "/api/favorites/", {"activity_id": activity.id}, format="json"
        )
        assert second.status_code == 409
        assert second.data["error"]["code"] == "conflict"

    def test_deleting_a_missing_favorite_is_404_not_500(self, as_participant, activity):
        response = as_participant.delete(f"/api/favorites/{activity.id}/")
        assert response.status_code == 404


class TestChatGroups:
    def test_non_member_cannot_read_group_messages(
        self, as_outsider, as_organizer, booking, activity
    ):
        as_organizer.patch(
            f"/api/bookings/{booking.id}/action/", {"action": "accept"}, format="json"
        )
        group = activity.chat_group
        response = as_outsider.get(f"/api/groups/{group.id}/chat/")
        assert response.status_code == 403

    def test_organizer_cannot_be_removed_from_group(
        self, as_organizer, booking, activity, organizer
    ):
        as_organizer.patch(
            f"/api/bookings/{booking.id}/action/", {"action": "accept"}, format="json"
        )
        group = activity.chat_group
        response = as_organizer.post(
            f"/api/groups/{group.id}/remove-member/",
            {"user_id": str(organizer.id)},  # string id must still be matched
            format="json",
        )
        assert response.status_code == 403
        assert organizer in group.members.all()


class TestDebugEndpointsRemoved:
    @pytest.mark.parametrize(
        "path", ["/api/auth/debug/get-otp/", "/api/auth/debug/skip-otp/"]
    )
    def test_debug_otp_endpoints_are_gone(self, api, path):
        assert (
            api.post(path, {"email": "x@gmail.com"}, format="json").status_code == 404
        )
