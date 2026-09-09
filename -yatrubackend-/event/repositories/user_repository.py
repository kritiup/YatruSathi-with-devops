import logging
from typing import Optional

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from .base_repository import BaseRepository

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, email: str) -> Optional[User]:
        """Look up a user by email address.

        Case-insensitive: addresses are not case-sensitive in practice, and an
        exact match meant someone who signed up as "Me@example.com" could not
        log in or reset their password by typing "me@example.com".

        Django puts no uniqueness constraint on ``User.email``, so duplicates
        can and do exist. ``.get()`` raised ``MultipleObjectsReturned`` on those
        — an unhandled 500 on password reset and login. Pick deterministically
        instead: an active account first, then the oldest, which is the original
        registration rather than whatever was created later.
        """
        if not email:
            return None

        matches = list(User.objects.filter(email__iexact=email.strip()).order_by("id"))
        if not matches:
            return None
        if len(matches) > 1:
            logger.warning(
                "%d users share the email %s (ids: %s) — using the first active "
                "or oldest account.",
                len(matches),
                email,
                ", ".join(str(u.pk) for u in matches),
            )
        return next((u for u in matches if u.is_active), matches[0])

    def get_by_username(self, username: str) -> Optional[User]:
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None


class TokenRepository:
    """
    Repository for managing authentication tokens.
    """

    def get_or_create_token(self, user: User) -> str:
        token, _ = Token.objects.get_or_create(user=user)
        return token.key

    def delete_token(self, user: User):
        try:
            user.auth_token.delete()
        except User.auth_token.RelatedObjectDoesNotExist:
            pass
