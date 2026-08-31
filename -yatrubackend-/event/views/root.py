"""API root — a directory of the available endpoints."""

import logging

from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.reverse import reverse

logger = logging.getLogger("event")


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def api_root(request, format=None):
    """Lists the top-level endpoints, for discovery and smoke-testing."""
    logger.info("API root accessed from %s", request.META.get("REMOTE_ADDR"))

    def url(name):
        return reverse(name, request=request, format=format)

    return Response(
        {
            "message": "Welcome to Yaatrusathi API",
            "endpoints": {
                "authentication": {
                    "login": url("login"),
                    "logout": url("logout"),
                    "signup": url("signup"),
                    "verify_otp": url("verify-otp"),
                    "resend_otp": url("resend-otp"),
                },
                "activities": {
                    "list_create": url("activity-list-create"),
                    "detail": "/api/activities/{id}/",
                },
                "catalogue": {
                    "destinations": url("destination-list"),
                    "destination_detail": "/api/destinations/{slug}/",
                    "activity_types": url("activity-type-list"),
                    "packages": url("package-list"),
                    "package_detail": "/api/packages/{slug}/",
                    "package_bookings": url("package-booking-list-create"),
                    "dashboard_summary": url("dashboard-summary"),
                },
                "notifications": {
                    "list": url("notification-list"),
                    "detail": "/api/notifications/{id}/",
                },
                "chat": {
                    "activity_chat": "/api/activities/{activity_id}/chat/",
                    "group_chat": "/api/groups/{group_id}/chat/",
                },
                "groups": {
                    "list": url("chatgroup-list"),
                    "detail": "/api/groups/{id}/",
                },
                "favorites": {
                    "list_create": url("favorite-list-create"),
                    "delete": "/api/favorites/{activity_id}/",
                },
                "profile": {"detail": url("profile-detail")},
                "bookings": {
                    "list_create": url("booking-list-create"),
                    "detail": "/api/bookings/{id}/",
                },
                "reviews": {
                    "list_create": url("review-list"),
                    "activity_reviews": "/api/activities/{activity_id}/reviews/",
                },
                "users": {"list": url("user-list")},
            },
        }
    )
