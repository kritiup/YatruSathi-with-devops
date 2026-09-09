"""Deploy-time configuration checks for outbound email.

These run under ``manage.py check --deploy`` and on every management command,
so a misconfigured sender is caught before it silently breaks password reset
for real users rather than after the support emails start arriving.
"""

from django.conf import settings
from django.core.checks import Warning, register

# Resend's shared sandbox sender. Resend refuses (HTTP 403) every recipient
# except the address that owns the API key, so this only ever works for one
# person — fine in development, broken in production.
SANDBOX_SENDER = "onboarding@resend.dev"

W001 = "event.E_email.W001"
W002 = "event.E_email.W002"


@register("email")
def check_email_sender(app_configs, **kwargs):
    """Warn when production email cannot reach real users."""
    if settings.DEBUG:
        return []

    warnings = []
    resend_key = getattr(settings, "RESEND_API_KEY", None)
    sender = (getattr(settings, "RESEND_FROM_EMAIL", "") or "").strip().lower()
    smtp_configured = bool(getattr(settings, "EMAIL_HOST_PASSWORD", None))

    if resend_key and sender == SANDBOX_SENDER:
        warnings.append(
            Warning(
                "RESEND_FROM_EMAIL is still Resend's sandbox sender "
                f"({SANDBOX_SENDER}).",
                hint=(
                    "Resend will refuse every recipient except the address that "
                    "owns the API key, so signup OTPs and password resets will "
                    "fail for real users. Verify a domain at "
                    "https://resend.com/domains and set RESEND_FROM_EMAIL to an "
                    "address on it, e.g. no-reply@yourdomain.com."
                ),
                id=W001,
            )
        )

    if not resend_key and not smtp_configured:
        warnings.append(
            Warning(
                "No outbound email transport is configured.",
                hint=(
                    "Set RESEND_API_KEY (with a verified RESEND_FROM_EMAIL), or "
                    "SMTP credentials via EMAIL_HOST_USER / EMAIL_HOST_PASSWORD. "
                    "Without one, signup verification and password reset cannot "
                    "deliver their codes."
                ),
                id=W002,
            )
        )

    return warnings
