"""Reusable DRF permission classes.

Permission matrix
-----------------
IsOwnerOrReadOnly   write requires being the object's owner/creator/sender
IsActivityCreator   write requires being the creator of the related activity
IsGroupMember       any access requires membership of the chat group
IsPlatformAdmin     requires Django staff status or an admin JWT
"""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Read is open; writing requires owning the object.

    Ownership is whichever of `created_by`, `user` or `sender` the model has.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner = (
            getattr(obj, "created_by", None)
            or getattr(obj, "user", None)
            or getattr(obj, "sender", None)
        )
        return owner == request.user


class IsActivityCreator(permissions.BasePermission):
    """Write access limited to the organiser of the related activity."""

    message = "Only the activity organizer can perform this action."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        activity = getattr(obj, "activity", None) or obj
        return getattr(activity, "created_by", None) == request.user


class IsGroupMember(permissions.BasePermission):
    """Access limited to members of the chat group."""

    message = "You are not a member of this group."

    def has_object_permission(self, request, view, obj):
        group = getattr(obj, "group", None) or obj
        members = getattr(group, "members", None)
        if members is None:
            return False
        return members.filter(pk=request.user.pk).exists()


class IsPlatformAdmin(permissions.BasePermission):
    """Admin access, granted either by Django staff status or an admin JWT.

    The admin login endpoint issues a token whose payload carries `is_admin`;
    see `event.authentication`. Django staff and superusers also qualify, so
    the Django admin's own users can reach these endpoints.
    """

    message = "Unauthorized. Admin access required."

    def has_permission(self, request, view):
        user = request.user
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True
        payload = getattr(getattr(request, "auth", None), "payload", None)
        return bool(payload and payload.get("is_admin", False))
