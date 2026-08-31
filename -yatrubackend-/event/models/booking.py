"""Booking model."""

from django.contrib.auth.models import User
from django.db import models

from .activity import Activity


class Booking(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="bookings"
    )
    booked_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    ticket_count = models.IntegerField(default=1)

    class Meta:
        unique_together = ("user", "activity")
        ordering = ["-booked_at"]

    def __str__(self):
        return f"{self.user.username} - {self.activity.title}"
