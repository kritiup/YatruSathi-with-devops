import os

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# Single built-in admin account. Both values come from the environment;
# ADMIN_PASSWORD has no default, so admin login stays disabled until it is set.
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@yatrusathi.local")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login_api(request):
    """
    Admin login endpoint. Credentials are supplied via ADMIN_EMAIL /
    ADMIN_PASSWORD environment variables. Only one admin account exists.
    """
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "").strip()

    if not ADMIN_PASSWORD:
        return Response(
            {"error": "Admin login is not configured on this server"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check admin credentials
    if email != ADMIN_EMAIL.lower() or password != ADMIN_PASSWORD:
        return Response(
            {"error": "Invalid admin credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

    # Generate JWT tokens (use a dummy user object for admin)
    # Create a custom payload for admin
    from rest_framework_simplejwt.tokens import AccessToken

    access_token = AccessToken()
    access_token["email"] = ADMIN_EMAIL
    access_token["is_admin"] = True
    access_token["user_id"] = "admin"

    refresh = RefreshToken()
    refresh["email"] = ADMIN_EMAIL
    refresh["is_admin"] = True
    refresh["user_id"] = "admin"

    return Response(
        {
            "access": str(access_token),
            "refresh": str(refresh),
            "user": {"email": ADMIN_EMAIL, "is_admin": True, "username": "Admin"},
        },
        status=status.HTTP_200_OK,
    )
