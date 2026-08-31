"""Chat group membership and messaging rules."""

import logging

from django.contrib.auth.models import User
from django.utils import timezone

from ..models import ChatGroup, ChatGroupReadStatus, ChatMessage
from ..shared.exceptions import NotFoundError, PermissionError_, ValidationError_
from .notification_service import NotificationService

logger = logging.getLogger("event")


class ChatService:
    @staticmethod
    def get_group(group_id: int) -> ChatGroup:
        try:
            return ChatGroup.objects.get(pk=group_id)
        except ChatGroup.DoesNotExist:
            raise NotFoundError("Group not found.")

    @staticmethod
    def require_membership(group: ChatGroup, user: User) -> None:
        if not group.members.filter(pk=user.pk).exists():
            raise PermissionError_("You are not a member of this group.")

    @staticmethod
    def require_organizer(group: ChatGroup, user: User) -> None:
        if group.activity.created_by != user:
            raise PermissionError_(
                "Only the activity organizer can manage group members."
            )

    @staticmethod
    def ensure_group_for_activity(activity) -> ChatGroup:
        """Get or create the activity's chat group, seeding it with the organiser."""
        group, created = ChatGroup.objects.get_or_create(
            activity=activity, defaults={"name": f"{activity.title} Group"}
        )
        if created:
            group.members.add(activity.created_by)
        return group

    @staticmethod
    def _parse_user_id(raw) -> int:
        """JSON bodies send ids as either int or string; normalise to int."""
        try:
            return int(raw)
        except (TypeError, ValueError):
            raise ValidationError_("A numeric user_id is required.")

    @staticmethod
    def add_member(group_id: int, actor: User, user_id) -> User:
        group = ChatService.get_group(group_id)
        ChatService.require_organizer(group, actor)
        try:
            user = User.objects.get(id=ChatService._parse_user_id(user_id))
        except User.DoesNotExist:
            raise NotFoundError("User not found.")
        group.members.add(user)
        return user

    @staticmethod
    def remove_member(group_id: int, actor: User, user_id) -> User:
        group = ChatService.get_group(group_id)
        ChatService.require_organizer(group, actor)
        parsed_id = ChatService._parse_user_id(user_id)
        if parsed_id == group.activity.created_by_id:
            raise PermissionError_("The organizer cannot be removed from the group.")
        try:
            user = User.objects.get(id=parsed_id)
        except User.DoesNotExist:
            raise NotFoundError("User not found.")
        group.members.remove(user)
        return user

    @staticmethod
    def mark_group_read(group_id: int, user: User) -> ChatGroupReadStatus:
        group = ChatService.get_group(group_id)
        ChatService.require_membership(group, user)
        read_status, created = ChatGroupReadStatus.objects.get_or_create(
            group=group, user=user, defaults={"last_read_at": timezone.now()}
        )
        if not created:
            read_status.last_read_at = timezone.now()
            read_status.save(update_fields=["last_read_at"])
        return read_status

    @staticmethod
    def post_system_message(group: ChatGroup, text: str) -> ChatMessage:
        """Post a server-authored notice, attributed to the activity organiser."""
        return ChatMessage.objects.create(
            group=group,
            sender=group.activity.created_by,
            message=text,
            is_system=True,
        )

    @staticmethod
    def messages_for_group(group_id: int, user: User):
        group = ChatService.get_group(group_id)
        ChatService.require_membership(group, user)
        return ChatMessage.objects.filter(group=group).select_related("sender")

    @staticmethod
    def messages_for_activity(activity_id: int):
        return ChatMessage.objects.filter(activity_id=activity_id).select_related(
            "sender"
        )

    @staticmethod
    def send_group_message(group_id: int, sender: User, serializer) -> ChatMessage:
        group = ChatService.get_group(group_id)
        ChatService.require_membership(group, sender)
        message = serializer.save(sender=sender, group=group)
        NotificationService.notify_group_message(message)
        return message
