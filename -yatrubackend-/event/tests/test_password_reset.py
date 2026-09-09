"""Password reset: the three-step forgot-password flow and its email lookup.

The OTP itself is read from the database rather than an inbox, so these tests
cover the flow's logic; email delivery is a transport concern handled in
``AuthService._deliver_otp_email``.
"""

from unittest.mock import patch

import pytest
from django.contrib.auth.models import User

from event.models import Profile
from event.repositories.user_repository import UserRepository

pytestmark = pytest.mark.django_db

GOOD_PASSWORD = "Passw0rd!"
NEW_PASSWORD = "BrandNewPassw0rd!"


@pytest.fixture
def resettable_user():
    user = User.objects.create_user(
        username="resetme", email="Reset.Me@gmail.com", password=GOOD_PASSWORD
    )
    Profile.objects.get_or_create(user=user)
    return user


class TestEmailLookup:
    """`get_by_email` backs every step of the reset flow."""

    def test_is_case_insensitive(self, resettable_user):
        # Signing up as "Reset.Me@gmail.com" must not stop the user resetting
        # their password by typing it in lower case.
        found = UserRepository().get_by_email("reset.me@gmail.com")
        assert found == resettable_user

    def test_ignores_surrounding_whitespace(self, resettable_user):
        assert UserRepository().get_by_email("  reset.me@gmail.com ") == resettable_user

    def test_duplicate_emails_do_not_raise(self, resettable_user):
        # Django puts no unique constraint on User.email; duplicates used to
        # raise MultipleObjectsReturned and 500 the endpoint.
        User.objects.create_user(
            username="dupe", email="Reset.Me@gmail.com", password=GOOD_PASSWORD
        )
        assert User.objects.filter(email="Reset.Me@gmail.com").count() == 2
        assert UserRepository().get_by_email("Reset.Me@gmail.com") is not None

    def test_prefers_an_active_account_over_an_inactive_one(self):
        inactive = User.objects.create_user(
            username="older", email="shared@gmail.com", password=GOOD_PASSWORD
        )
        inactive.is_active = False
        inactive.save(update_fields=["is_active"])
        active = User.objects.create_user(
            username="newer", email="shared@gmail.com", password=GOOD_PASSWORD
        )
        assert UserRepository().get_by_email("shared@gmail.com") == active

    def test_unknown_email_returns_none(self):
        assert UserRepository().get_by_email("nobody@gmail.com") is None

    def test_blank_email_returns_none(self):
        assert UserRepository().get_by_email("") is None


class TestForgotPasswordFlow:
    def _request_otp(self, api, email):
        return api.post(
            "/api/auth/forgot-password/request-otp/", {"email": email}, format="json"
        )

    def test_full_reset_changes_the_password(self, api, resettable_user):
        # The OTP is stored hashed, so pin the generated code rather than
        # trying to read it back out of the database.
        with (
            patch(
                "event.services.auth_service.AuthService._generate_otp_code",
                return_value="123456",
            ),
            patch(
                "event.services.auth_service.AuthService._deliver_otp_email",
                return_value=True,
            ),
        ):
            response = self._request_otp(api, "reset.me@gmail.com")
        assert response.status_code == 200

        # Mixed case again, to prove every step uses the same lookup.
        verify = api.post(
            "/api/auth/forgot-password/verify-otp/",
            {"email": "RESET.ME@gmail.com", "code": "123456"},
            format="json",
        )
        assert verify.status_code == 200
        token = verify.data["reset_token"]

        reset = api.post(
            "/api/auth/forgot-password/reset/",
            {
                "email": "reset.me@GMAIL.com",
                "reset_token": token,
                "new_password": NEW_PASSWORD,
            },
            format="json",
        )
        assert reset.status_code == 200

        resettable_user.refresh_from_db()
        assert resettable_user.check_password(NEW_PASSWORD)
        assert not resettable_user.check_password(GOOD_PASSWORD)
        assert resettable_user.profile.password_reset_token == ""

    def test_reports_failure_when_no_transport_accepts_the_email(
        self, api, resettable_user
    ):
        # Previously this returned 200 "OTP sent to your email" regardless, so
        # the user waited for a code that was never delivered.
        with patch(
            "event.services.auth_service.AuthService._deliver_otp_email",
            return_value=False,
        ):
            response = self._request_otp(api, "reset.me@gmail.com")
        assert response.status_code == 502
        assert "error" in response.data

    def test_duplicate_email_does_not_500(self, api, resettable_user):
        User.objects.create_user(
            username="dupe2", email="Reset.Me@gmail.com", password=GOOD_PASSWORD
        )
        with patch(
            "event.services.auth_service.AuthService._deliver_otp_email",
            return_value=True,
        ):
            response = self._request_otp(api, "reset.me@gmail.com")
        assert response.status_code == 200

    def test_unknown_email_is_404(self, api):
        response = self._request_otp(api, "nobody@gmail.com")
        assert response.status_code == 404

    def test_wrong_code_is_rejected(self, api, resettable_user):
        with (
            patch(
                "event.services.auth_service.AuthService._generate_otp_code",
                return_value="123456",
            ),
            patch(
                "event.services.auth_service.AuthService._deliver_otp_email",
                return_value=True,
            ),
        ):
            self._request_otp(api, "reset.me@gmail.com")

        response = api.post(
            "/api/auth/forgot-password/verify-otp/",
            {"email": "reset.me@gmail.com", "code": "000000"},
            format="json",
        )
        assert response.status_code == 400

    def test_reset_rejects_a_bad_token(self, api, resettable_user):
        response = api.post(
            "/api/auth/forgot-password/reset/",
            {
                "email": "reset.me@gmail.com",
                "reset_token": "not-the-real-token",
                "new_password": NEW_PASSWORD,
            },
            format="json",
        )
        assert response.status_code == 400
        resettable_user.refresh_from_db()
        assert resettable_user.check_password(GOOD_PASSWORD)

    def test_otp_cannot_be_reused(self, api, resettable_user):
        with (
            patch(
                "event.services.auth_service.AuthService._generate_otp_code",
                return_value="123456",
            ),
            patch(
                "event.services.auth_service.AuthService._deliver_otp_email",
                return_value=True,
            ),
        ):
            self._request_otp(api, "reset.me@gmail.com")

        first = api.post(
            "/api/auth/forgot-password/verify-otp/",
            {"email": "reset.me@gmail.com", "code": "123456"},
            format="json",
        )
        assert first.status_code == 200

        second = api.post(
            "/api/auth/forgot-password/verify-otp/",
            {"email": "reset.me@gmail.com", "code": "123456"},
            format="json",
        )
        assert second.status_code == 400


class TestEmailConfigChecks:
    """`event/checks.py` guards the sandbox-sender footgun at deploy time."""

    def _run(self, **overrides):
        from django.test import override_settings

        from event.checks import check_email_sender

        with override_settings(**overrides):
            return [w.id for w in check_email_sender(None)]

    def test_sandbox_sender_warns_in_production(self):
        ids = self._run(
            DEBUG=False,
            RESEND_API_KEY="re_fake",
            RESEND_FROM_EMAIL="onboarding@resend.dev",
        )
        assert "event.E_email.W001" in ids

    def test_verified_domain_sender_is_clean(self):
        ids = self._run(
            DEBUG=False,
            RESEND_API_KEY="re_fake",
            RESEND_FROM_EMAIL="no-reply@yatrusathi.com",
        )
        assert ids == []

    def test_no_transport_configured_warns(self):
        ids = self._run(
            DEBUG=False,
            RESEND_API_KEY=None,
            RESEND_FROM_EMAIL="",
            EMAIL_HOST_PASSWORD=None,
        )
        assert "event.E_email.W002" in ids

    def test_silent_in_local_development(self):
        ids = self._run(
            DEBUG=True,
            RESEND_API_KEY="re_fake",
            RESEND_FROM_EMAIL="onboarding@resend.dev",
        )
        assert ids == []
