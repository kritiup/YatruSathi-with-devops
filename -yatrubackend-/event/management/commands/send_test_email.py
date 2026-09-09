"""Send a single test email through the app's real delivery path.

Use it to confirm a newly verified Resend domain actually delivers before
trusting signup or password reset to it:

    python manage.py send_test_email you@example.com

It goes through ``AuthService._deliver_otp_email``, so it exercises exactly the
transport chain the OTP emails use — Resend first, then Django's email backend.
"""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from event.services.auth_service import AuthService


class Command(BaseCommand):
    help = "Send a test email through the real OTP delivery path."

    def add_arguments(self, parser):
        parser.add_argument("recipient", help="Address to send the test email to.")

    def handle(self, *args, **options):
        recipient = options["recipient"]

        sender = getattr(settings, "RESEND_FROM_EMAIL", "") or "(unset)"
        has_key = bool(getattr(settings, "RESEND_API_KEY", None))
        self.stdout.write(f"Resend key configured : {has_key}")
        self.stdout.write(f"RESEND_FROM_EMAIL     : {sender}")
        self.stdout.write(f"EMAIL_BACKEND         : {settings.EMAIL_BACKEND}")
        self.stdout.write(f"Sending to            : {recipient}\n")

        if has_key and sender.strip().lower() == "onboarding@resend.dev":
            self.stdout.write(
                self.style.WARNING(
                    "RESEND_FROM_EMAIL is Resend's sandbox sender — Resend will "
                    "refuse any recipient except the API key owner's own address."
                )
            )

        delivered = AuthService()._deliver_otp_email(
            recipient,
            "YatruSathi — test email",
            "If you received this, outbound email is working. "
            "This message was sent by `manage.py send_test_email`.",
        )

        if not delivered:
            raise CommandError(
                "Delivery failed on every transport. The reason was logged above "
                "(the Resend response body says why it was refused)."
            )

        self.stdout.write(self.style.SUCCESS("Delivered."))
