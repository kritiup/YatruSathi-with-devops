from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..services.auth_service import AuthService


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_api(request):
    """
    Endpoint for user logout.
    Deletes the current user's authentication token.
    """
    auth_service = AuthService()
    auth_service.logout(request.user)
    return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
