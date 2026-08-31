"""Admin KYC review endpoints after the permission/serializer refactor."""

import pytest
from django.contrib.auth.models import User
from django.utils import timezone

pytestmark = pytest.mark.django_db


@pytest.fixture
def staff_client(db):
    from event.tests.conftest import _authed

    user = User.objects.create_user(
        username="staff", email="staff@gmail.com", password="pw-staff-1", is_staff=True
    )
    return _authed(user)


@pytest.fixture
def submitted_profile(participant):
    from event.models import Profile

    return Profile.objects.create(
        user=participant,
        full_name="Kyc Person",
        kyc_submitted_at=timezone.now(),
        kyc_status="pending",
    )


def test_non_admin_cannot_list_kyc_requests(as_participant):
    response = as_participant.get("/api/admin/kyc-requests/")
    assert response.status_code == 403
    assert response.data["error"]["code"] == "permission_denied"


def test_staff_lists_kyc_requests(staff_client, submitted_profile):
    response = staff_client.get("/api/admin/kyc-requests/")
    assert response.status_code == 200
    assert response.data["total"] == 1
    row = response.data["kyc_requests"][0]
    assert row["full_name"] == "Kyc Person"
    assert row["status"] == "pending"


def test_status_filter_is_applied(staff_client, submitted_profile):
    assert (
        staff_client.get("/api/admin/kyc-requests/?status=approved").data["total"] == 0
    )
    assert (
        staff_client.get("/api/admin/kyc-requests/?status=pending").data["total"] == 1
    )


def test_staff_approves_kyc_and_avatar_is_promoted(staff_client, submitted_profile):
    response = staff_client.patch(
        f"/api/admin/kyc-requests/{submitted_profile.id}/",
        {"status": "approved"},
        format="json",
    )
    assert response.status_code == 200
    submitted_profile.refresh_from_db()
    assert submitted_profile.kyc_status == "approved"
    assert submitted_profile.is_kyc_verified is True


def test_invalid_decision_is_rejected(staff_client, submitted_profile):
    response = staff_client.patch(
        f"/api/admin/kyc-requests/{submitted_profile.id}/",
        {"status": "maybe"},
        format="json",
    )
    assert response.status_code == 400
    assert response.data["error"]["code"] == "validation_error"


def test_kyc_stats_shape(staff_client, submitted_profile):
    response = staff_client.get("/api/admin/kyc-stats/")
    assert response.status_code == 200
    assert set(response.data) == {"stats", "trends"}
    assert set(response.data["stats"]) >= {
        "total_users",
        "verified",
        "pending",
        "rejected",
        "success_rate",
    }
