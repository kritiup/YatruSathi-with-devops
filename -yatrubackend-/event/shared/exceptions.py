"""Custom exceptions and a single, consistent error response shape.

Every error the API returns takes the form:

    {"error": {"code": "not_found", "message": "...", "details": {...}}}

`details` is present only when a serializer supplied field-level errors.
"""

import logging

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("event")


class ServiceError(APIException):
    """Base class for errors raised by the service layer.

    Services raise these instead of returning Response objects, which keeps
    business logic free of HTTP concerns and testable without a request.
    """

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The request could not be completed."
    default_code = "service_error"


class NotFoundError(ServiceError):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "The requested resource was not found."
    default_code = "not_found"


class PermissionError_(ServiceError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"


class ValidationError_(ServiceError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The submitted data was invalid."
    default_code = "validation_error"


class ConflictError(ServiceError):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The resource is already in that state."
    default_code = "conflict"


# Django's Http404 and PermissionDenied carry no `default_code`, so fall back
# to the status code DRF chose for them.
_STATUS_CODES = {
    400: "validation_error",
    401: "not_authenticated",
    403: "permission_denied",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    429: "throttled",
}


def api_exception_handler(exc, context):
    """Normalise every DRF error into the envelope documented above."""
    response = drf_exception_handler(exc, context)

    if response is None:
        # Not a DRF exception — let Django's handler produce a 500 so the
        # traceback still reaches the logs and error tracking.
        logger.exception("Unhandled exception in %s", context.get("view"))
        return None

    code = getattr(exc, "default_code", None) or _STATUS_CODES.get(
        response.status_code, "error"
    )
    data = response.data
    details = None

    if isinstance(data, dict) and "detail" in data:
        message = str(data["detail"])
    elif isinstance(data, dict):
        # Serializer validation errors: {"field": ["msg", ...], ...}
        message = "The submitted data was invalid."
        details = data
    elif isinstance(data, list):
        message = "; ".join(str(item) for item in data)
    else:
        message = str(data)

    payload = {"code": code, "message": message}
    if details is not None:
        payload["details"] = details

    response.data = {"error": payload}
    return response
