from django.contrib.auth.hashers import check_password
from rest_framework import permissions, status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response

from ..models import EmailOTP, Profile
from ..repositories.user_repository import TokenRepository, UserRepository


@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def verify_otp_api(request):
    email = request.data.get("email")
    code = request.data.get("code")

    if not email or not code:
        return Response(
            {"error": "Email and OTP code are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_repo = UserRepository()
    user = user_repo.get_by_email(email)
    if not user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    otp = (
        EmailOTP.objects.filter(user=user, is_used=False)
        .order_by("-created_at")
        .first()
    )
    if not otp:
        return Response(
            {"error": "OTP not found. Please request a new code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if otp.is_expired():
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        return Response(
            {"error": "OTP expired. Please request a new code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not check_password(code, otp.code_hash):
        otp.attempts += 1
        if otp.attempts >= 5:
            otp.is_used = True
        otp.save(update_fields=["attempts", "is_used"])
        return Response(
            {"error": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST
        )

    otp.is_used = True
    otp.save(update_fields=["is_used"])

    user.is_active = True
    user.save(update_fields=["is_active"])

    Profile.objects.get_or_create(user=user)
    token_key = TokenRepository().get_or_create_token(user)

    return Response(
        {
            "token": token_key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        },
        status=status.HTTP_200_OK,
    )
