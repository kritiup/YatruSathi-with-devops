from rest_framework import permissions, status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response

from ..services.auth_service import AuthService


@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def login_api(request):
    """
    Endpoint for user login.
    Accepted fields: email, password
    Returns: token and user info
    """
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthService()
    try:
        auth_data = auth_service.login(email, password)
    except ValueError as e:
        return Response(
            {"error": str(e), "verification_required": True},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not auth_data:
        return Response(
            {"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED
        )

    return Response(auth_data, status=status.HTTP_200_OK)
