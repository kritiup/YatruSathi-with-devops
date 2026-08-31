"""Chat group, membership read-state, and message models."""

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from .activity import Activity


class ChatGroup(models.Model):
    activity = models.OneToOneField(
        Activity, on_delete=models.CASCADE, related_name="chat_group"
    )
    name = models.CharField(max_length=255)
    members = models.ManyToManyField(User, related_name="chat_groups")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Group: {self.name} ({self.activity.title})"


class ChatGroupReadStatus(models.Model):
    """Tracks how far each member has read, so unread counts can be derived."""

    group = models.ForeignKey(
        ChatGroup, on_delete=models.CASCADE, related_name="read_statuses"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="chat_read_statuses"
    )
    last_read_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("group", "user")

    def __str__(self):
        return f"{self.user.username} read {self.group.name} at {self.last_read_at}"


class ChatMessage(models.Model):
    """A message in either an activity chat or a group chat.

    Exactly one of `activity` or `group` is set, depending on which
    conversation the message belongs to.
    """

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="chat_messages",
        null=True,
        blank=True,
    )
    group = models.ForeignKey(
        ChatGroup,
        on_delete=models.CASCADE,
        related_name="messages",
        null=True,
        blank=True,
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_system = models.BooleanField(default=False)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.sender.username}: {self.message[:20]}"
