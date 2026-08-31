import json
import logging
import time

logger = logging.getLogger("event")


class RequestLoggingMiddleware:
    """
    Middleware to log all incoming requests and outgoing responses
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log request
        start_time = time.time()

        # Get client IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")

        # Log request details
        logger.info(f">>> REQUEST: {request.method} {request.path} from {ip}")
        logger.debug(f"    Headers: {dict(request.headers)}")
        logger.debug(
            f"    User: {request.user if hasattr(request, 'user') else 'Not authenticated'}"
        )

        # Log request body for POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                if request.content_type == "application/json" and request.body:
                    body = json.loads(request.body)
                    # Redact sensitive fields
                    sanitized_body = self._sanitize_data(body)
                    logger.debug(f"    Body: {sanitized_body}")
            except Exception:
                logger.debug(
                    "    Body: Unable to parse (multipart/form-data or binary)"
                )

        # Process request
        response = self.get_response(request)

        # Log response
        duration = (time.time() - start_time) * 1000  # Convert to ms

        logger.info(
            f"<<< RESPONSE: {request.method} {request.path} - Status {response.status_code} ({duration:.2f}ms)"
        )

        # Log response body for errors
        if response.status_code >= 400:
            try:
                if hasattr(response, "data"):
                    logger.error(f"    Error Response: {response.data}")
            except Exception:
                pass

        return response

    def _sanitize_data(self, data):
        """Remove sensitive information from logs"""
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                if key.lower() in ["password", "token", "secret", "api_key"]:
                    sanitized[key] = "***REDACTED***"
                elif isinstance(value, dict):
                    sanitized[key] = self._sanitize_data(value)
                else:
                    sanitized[key] = value
            return sanitized
        return data
