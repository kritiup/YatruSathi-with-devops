from typing import Optional

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from .base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, email: str) -> Optional[User]:
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

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
