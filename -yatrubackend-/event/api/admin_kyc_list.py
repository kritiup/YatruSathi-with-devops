"""Admin KYC review: the request queue and dashboard statistics."""

from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Profile
from ..serializers.admin import KycRequestSerializer
from ..shared.permissions import IsPlatformAdmin

VALID_STATUS_FILTERS = {"pending", "approved", "rejected"}


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_kyc_stats_api(request):
    """Totals and monthly submission trends for the admin dashboard."""
    total_users = User.objects.count()
    verified = Profile.objects.filter(is_kyc_verified=True).count()
    pending = Profile.objects.filter(
        kyc_status="pending", kyc_submitted_at__isnull=False
    ).count()
    rejected = Profile.objects.filter(kyc_status="rejected").count()

    monthly = (
        Profile.objects.filter(kyc_submitted_at__isnull=False)
        .annotate(month=TruncMonth("kyc_submitted_at"))
        .values("month")
        .annotate(
            total=Count("id"),
            verified=Count("id", filter=Q(kyc_status="approved")),
            rejected=Count("id", filter=Q(kyc_status="rejected")),
            pending=Count("id", filter=Q(kyc_status="pending")),
        )
        .order_by("month")
    )

    trends = [
        {
            "name": entry["month"].strftime("%b %Y"),
            "total": entry["total"],
            "verified": entry["verified"],
            "rejected": entry["rejected"],
            "pending": entry["pending"],
        }
        for entry in monthly
    ]

    return Response(
        {
            "stats": {
                "total_users": total_users,
                "verified": verified,
                "pending": pending,
                "rejected": rejected,
                "success_rate": (
                    round(verified / total_users * 100, 1) if total_users else 0
                ),
            },
            "trends": trends,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_kyc_list_api(request):
    """The KYC review queue, newest submission first.

    Accepts `?status=pending|approved|rejected`; anything else lists all.
    """
    profiles = Profile.objects.filter(kyc_submitted_at__isnull=False).select_related(
        "user"
    )

    status_filter = request.query_params.get("status", "all")
    if status_filter in VALID_STATUS_FILTERS:
        profiles = profiles.filter(kyc_status=status_filter)

    serializer = KycRequestSerializer(
        profiles.order_by("-kyc_submitted_at"), many=True, context={"request": request}
    )
    return Response({"kyc_requests": serializer.data, "total": len(serializer.data)})
