import secrets

from rest_framework import permissions, status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response

from ..models import EmailOTP
from ..repositories.user_repository import UserRepository
from ..services.auth_service import AuthService


# Step 1: Request OTP for password reset
@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def forgot_password_request_otp_api(request):
    email = request.data.get("email")
    if not email:
        return Response(
            {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )
    user_repo = UserRepository()
    user = user_repo.get_by_email(email)
    if not user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    AuthService()._create_email_otp(user)
    return Response({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)


# Step 2: Verify OTP for password reset
@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def forgot_password_verify_otp_api(request):
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
    from django.contrib.auth.hashers import check_password

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
    # Generate a short-lived reset token (for demo, use a random string)
    reset_token = secrets.token_urlsafe(32)
    user.profile.password_reset_token = reset_token
    user.profile.save(update_fields=["password_reset_token"])
    return Response({"reset_token": reset_token}, status=status.HTTP_200_OK)


# Step 3: Set new password using reset token
@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def forgot_password_reset_api(request):
    email = request.data.get("email")
    reset_token = request.data.get("reset_token")
    new_password = request.data.get("new_password")
    if not email or not reset_token or not new_password:
        return Response(
            {"error": "Email, reset token, and new password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user_repo = UserRepository()
    user = user_repo.get_by_email(email)
    if not user or not hasattr(user, "profile"):
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    if user.profile.password_reset_token != reset_token:
        return Response(
            {"error": "Invalid or expired reset token"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.set_password(new_password)
    user.save(update_fields=["password"])
    user.profile.password_reset_token = ""
    user.profile.save(update_fields=["password_reset_token"])
    return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
