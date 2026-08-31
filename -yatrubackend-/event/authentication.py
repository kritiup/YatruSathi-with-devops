from dataclasses import dataclass

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings


@dataclass
class AdminUser:
    """Lightweight user object for hardcoded admin JWTs."""

    email: str
    username: str = "Admin"
    id: str = "admin"
    is_staff: bool = True
    is_superuser: bool = True

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False


class AdminJWTAuthentication(JWTAuthentication):
    """JWT auth that accepts hardcoded admin tokens without DB lookup."""

    def get_user(self, validated_token):
        is_admin = validated_token.get("is_admin", False)
        user_id = validated_token.get(api_settings.USER_ID_CLAIM)
        if is_admin and user_id == "admin":
            email = validated_token.get("email", "")
            return AdminUser(email=email)

        return super().get_user(validated_token)
