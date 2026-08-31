"""Admin approves or rejects a KYC submission."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..services import ProfileService
from ..shared.permissions import IsPlatformAdmin


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_kyc_approve_api(request, profile_id):
    """Set a profile's KYC decision.

    Body: {"status": "approved" | "rejected"}. Approving also promotes the
    submitted KYC photo to the user's avatar.
    """
    profile = ProfileService.review_kyc(profile_id, request.data.get("status"))

    return Response(
        {
            "message": f"KYC request {profile.kyc_status} successfully",
            "profile": {
                "id": profile.id,
                "user_id": profile.user.id,
                "full_name": profile.full_name,
                "email": profile.user.email,
                "status": profile.kyc_status,
                "is_kyc_verified": profile.is_kyc_verified,
            },
        }
    )
