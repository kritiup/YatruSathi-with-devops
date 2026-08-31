import json
import logging
import secrets
from datetime import timedelta
from typing import Any, Dict, Optional
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone

from ..models import EmailOTP, Profile
from ..repositories.user_repository import TokenRepository, UserRepository

logger = logging.getLogger(__name__)


class AuthService:
    """
    Service layer for Authentication business logic.
    Handles login, signup, and logout operations.
    """

    def __init__(self):
        self.user_repo = UserRepository()
        self.token_repo = TokenRepository()

    def _generate_otp_code(self) -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    def _send_email_resend(self, to_email: str, subject: str, text_body: str) -> None:
        api_key = getattr(settings, "RESEND_API_KEY", None)
        from_email = getattr(settings, "RESEND_FROM_EMAIL", None)
        if not api_key or not from_email:
            raise ValueError("Resend API key or sender email not configured")

        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "text": text_body,
        }
        data = json.dumps(payload).encode("utf-8")
        req = urlrequest.Request(
            "https://api.resend.com/emails",
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlrequest.urlopen(req, timeout=15) as resp:
                if resp.status >= 400:
                    raise Exception(f"Resend API error: HTTP {resp.status}")
        except HTTPError as exc:
            raise Exception(f"Resend API error: {exc.code} {exc.reason}")
        except URLError as exc:
            raise Exception(f"Resend connection error: {exc.reason}")

    def _create_email_otp(self, user: User) -> bool:
        """Create a fresh OTP for ``user`` and email it.

        The OTP row is always written (a failure here *does* propagate — it is a
        real bug, not an expected condition). Delivery is best-effort: if every
        transport fails the error is logged and ``False`` is returned so the
        caller can tell the user their code did not go out. Returns ``True``
        when the email was accepted by a transport.
        """
        # Invalidate any outstanding codes, then mint a new one.
        EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)
        otp_code = self._generate_otp_code()
        EmailOTP.objects.create(
            user=user,
            code_hash=make_password(otp_code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        subject = "Yatrusathi - Your Verification Code"
        message = (
            f"Hello {user.username},\n\n"
            f"Your verification code is: {otp_code}\n\n"
            "This code will expire in 10 minutes.\n\n"
            "If you didn't request this code, please ignore this email.\n\n"
            "Best regards,\nYatrusathi Team"
        )

        logger.info("Sending OTP email to %s", user.email)
        sent = self._deliver_otp_email(user.email, subject, message)

        if sent:
            logger.info("OTP email sent to %s", user.email)
        else:
            logger.error(
                "OTP email to %s could not be delivered by any transport", user.email
            )
            if settings.DEBUG:
                # Local dev without a working mailer: surface the code so
                # verification is still testable. Never logged outside DEBUG.
                logger.warning("DEBUG: OTP for %s is %s", user.email, otp_code)

        return sent

    def _deliver_otp_email(self, to_email: str, subject: str, body: str) -> bool:
        """Try Resend (if configured) then Django's email backend.

        Each transport is attempted with real errors raised so they can be
        logged; returns ``True`` on the first success, ``False`` if all fail.
        """
        if getattr(settings, "RESEND_API_KEY", None):
            try:
                self._send_email_resend(to_email, subject, body)
                return True
            except Exception as exc:
                logger.warning(
                    "Resend API failed for %s: %s. Falling back to SMTP.",
                    to_email,
                    exc,
                )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False,
            )
            return True
        except Exception as exc:
            logger.error(
                "Email backend failed for %s: %s", to_email, exc, exc_info=True
            )
            return False

    def _validate_credentials(self, email: str, password: str) -> None:
        """
        Validates email domain and password complexity.
        Password: At least one uppercase letter and one symbol.
        Email: Domain must be in settings.ALLOWED_EMAIL_DOMAINS.
        """
        # Email domain validation
        domain = email.split("@")[-1].lower()
        allowed_domains = getattr(settings, "ALLOWED_EMAIL_DOMAINS", [])
        if allowed_domains and domain not in allowed_domains:
            raise ValueError(
                f'Email domain @{domain} is not allowed. Allowed domains: {", ".join(allowed_domains)}'
            )

        # Password complexity validation
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain at least one uppercase letter")

        symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in symbols for c in password):
            raise ValueError(
                "Password must contain at least one symbol (!@#$%^&* etc.)"
            )

    def login(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        # Validate credentials format
        self._validate_credentials(email, password)

        # Find user by email
        user = self.user_repo.get_by_email(email)
        if not user:
            return None

        if not user.is_active:
            raise ValueError("Email not verified")

        # Authenticate with credentials
        authenticated_user = authenticate(username=user.username, password=password)
        if not authenticated_user:
            return None

        # Get or create token
        token_key = self.token_repo.get_or_create_token(authenticated_user)

        # Ensure profile exists
        Profile.objects.get_or_create(user=authenticated_user)

        return {
            "token": token_key,
            "user": {
                "id": authenticated_user.id,
                "username": authenticated_user.username,
                "email": authenticated_user.email,
                "first_name": authenticated_user.first_name,
                "last_name": authenticated_user.last_name,
            },
        }

    def signup(
        self,
        username: str,
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
    ) -> Dict[str, Any]:
        # Validate credentials format
        self._validate_credentials(email, password)

        # Check if user exists
        existing_user_by_username = self.user_repo.get_by_username(username)
        existing_user_by_email = self.user_repo.get_by_email(email)

        # If user exists but is inactive (unverified), delete and allow re-registration
        if existing_user_by_username and not existing_user_by_username.is_active:
            existing_user_by_username.delete()
            existing_user_by_username = None
        elif existing_user_by_username:
            raise ValueError("Username already exists")

        if existing_user_by_email and not existing_user_by_email.is_active:
            existing_user_by_email.delete()
            existing_user_by_email = None
        elif existing_user_by_email:
            raise ValueError("Email already exists")

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user.is_active = False
        user.save(update_fields=["is_active"])

        # Create profile
        Profile.objects.create(user=user)

        # Generate and send OTP
        email_sent = self._create_email_otp(user)

        return {
            "message": (
                "OTP sent to your email. Please verify to complete signup."
                if email_sent
                else (
                    "Account created, but we could not send your verification "
                    'email. Use "Resend code" or contact support.'
                )
            ),
            "email": user.email,
            "verification_required": True,
            "email_sent": email_sent,
        }

    def logout(self, user: User):
        self.token_repo.delete_token(user)
