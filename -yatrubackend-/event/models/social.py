"""Favourites and reviews — the social layer over activities."""

from django.contrib.auth.models import User
from django.db import models

from .activity import Activity


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "activity")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} likes {self.activity.title}"


class Review(models.Model):
    """A review of an activity, or of a participant when `rated_user` is set.

    A participant reviews the activity they attended; an organiser reviews a
    participant by additionally setting `rated_user`.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.IntegerField(default=5)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    rated_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="organizer_ratings",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.rated_user:
            return (
                f"Rating by {self.user.username} for participant "
                f"{self.rated_user.username} in {self.activity.title}"
            )
        return f"Review by {self.user.username} for {self.activity.title}"
