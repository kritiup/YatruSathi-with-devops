"""Authentication support models."""

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class EmailOTP(models.Model):
    """A one-time code emailed to a user, stored only as a hash."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_otps")
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"EmailOTP for {self.user.email}"
