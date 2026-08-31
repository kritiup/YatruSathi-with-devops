"""Authentication endpoints: signup, login, logout.

Covers the critical paths only — account creation gating on email verification,
credential-format rules, and token lifecycle — not every branch of AuthService.
"""

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from event.models import EmailOTP, Profile

pytestmark = pytest.mark.django_db

# A password that satisfies AuthService._validate_credentials (>=1 upper, >=1 symbol).
GOOD_PASSWORD = "Passw0rd!"


@pytest.fixture
def verified_user():
    """An active user whose password passes the complexity check."""
    user = User.objects.create_user(
        username="verified", email="verified@gmail.com", password=GOOD_PASSWORD
    )
    Profile.objects.get_or_create(user=user)
    return user


class TestSignup:
    def test_creates_inactive_user_with_otp(self, api):
        response = api.post(
            "/api/auth/signup/",
            {
                "username": "newbie",
                "email": "newbie@gmail.com",
                "password": GOOD_PASSWORD,
            },
            format="json",
        )
        assert response.status_code == 201
        assert response.data["verification_required"] is True

        user = User.objects.get(username="newbie")
        assert user.is_active is False  # must verify OTP before logging in
        assert Profile.objects.filter(user=user).exists()
        assert EmailOTP.objects.filter(user=user, is_used=False).exists()

    def test_missing_fields_rejected(self, api):
        response = api.post("/api/auth/signup/", {"username": "x"}, format="json")
        assert response.status_code == 400

    @pytest.mark.parametrize("bad_password", ["alllowercase1!", "NoSymbol123", "short"])
    def test_weak_password_rejected(self, api, bad_password):
        response = api.post(
            "/api/auth/signup/",
            {"username": "weak", "email": "weak@gmail.com", "password": bad_password},
            format="json",
        )
        assert response.status_code == 400
        assert not User.objects.filter(username="weak").exists()

    def test_disallowed_email_domain_rejected(self, api):
        response = api.post(
            "/api/auth/signup/",
            {"username": "ext", "email": "ext@example.com", "password": GOOD_PASSWORD},
            format="json",
        )
        assert response.status_code == 400

    def test_duplicate_active_username_rejected(self, api, verified_user):
        response = api.post(
            "/api/auth/signup/",
            {
                "username": verified_user.username,
                "email": "other@gmail.com",
                "password": GOOD_PASSWORD,
            },
            format="json",
        )
        assert response.status_code == 400


class TestLogin:
    def test_unverified_user_cannot_log_in(self, api):
        api.post(
            "/api/auth/signup/",
            {
                "username": "pending",
                "email": "pending@gmail.com",
                "password": GOOD_PASSWORD,
            },
            format="json",
        )
        response = api.post(
            "/api/auth/login/",
            {"email": "pending@gmail.com", "password": GOOD_PASSWORD},
            format="json",
        )
        assert response.status_code == 403
        assert response.data.get("verification_required") is True

    def test_verified_user_gets_a_token(self, api, verified_user):
        response = api.post(
            "/api/auth/login/",
            {"email": verified_user.email, "password": GOOD_PASSWORD},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["token"]
        assert response.data["user"]["email"] == verified_user.email
        assert Token.objects.filter(user=verified_user).exists()

    def test_wrong_password_is_401(self, api, verified_user):
        response = api.post(
            "/api/auth/login/",
            {"email": verified_user.email, "password": "Wrong0rd!"},
            format="json",
        )
        assert response.status_code == 401

    def test_unknown_email_is_401(self, api):
        response = api.post(
            "/api/auth/login/",
            {"email": "ghost@gmail.com", "password": GOOD_PASSWORD},
            format="json",
        )
        assert response.status_code == 401

    def test_missing_fields_is_400(self, api):
        assert api.post("/api/auth/login/", {}, format="json").status_code == 400


class TestLogout:
    def test_requires_authentication(self, api):
        assert api.post("/api/auth/logout/").status_code in (401, 403)

    def test_deletes_the_callers_token(self, as_participant, participant):
        assert Token.objects.filter(user=participant).exists()
        response = as_participant.post("/api/auth/logout/")
        assert response.status_code == 200
        assert not Token.objects.filter(user=participant).exists()
