from django.utils import timezone
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


@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def resend_otp_api(request):
    email = request.data.get("email")

    if not email:
        return Response(
            {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    user_repo = UserRepository()
    user = user_repo.get_by_email(email)
    if not user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if user.is_active:
        return Response(
            {"error": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST
        )

    RESEND_INTERVAL = 60
    latest_otp = EmailOTP.objects.filter(user=user).order_by("-created_at").first()
    if latest_otp:
        elapsed = (timezone.now() - latest_otp.created_at).total_seconds()
        if elapsed < RESEND_INTERVAL:
            retry_after = int(RESEND_INTERVAL - elapsed) + 1
            response = Response(
                {
                    "error": f"Please wait {retry_after}s before requesting a new code",
                    "retry_after": retry_after,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            response["Retry-After"] = str(retry_after)
            return response

    email_sent = AuthService()._create_email_otp(user)

    if not email_sent:
        return Response(
            {
                "error": "We generated a new code but could not send the email. "
                "Please try again shortly or contact support.",
                "email_sent": False,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {"message": "OTP resent successfully", "email_sent": True},
        status=status.HTTP_200_OK,
    )
