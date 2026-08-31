"""Pagination classes shared by every list endpoint.

Pagination is opt-in: a request is only paginated when it carries a `page`
query parameter. Without one, the endpoint returns a plain list, which keeps
existing clients working while letting newer callers ask for pages.
"""

from rest_framework.pagination import PageNumberPagination


class OptInPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        if self.page_query_param not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)


class StandardResultsSetPagination(OptInPageNumberPagination):
    """Default: 20 per page, caller may request up to 100 with `page_size`."""


class LargeResultsSetPagination(OptInPageNumberPagination):
    """For chat history and similar, where bigger pages are the norm."""

    page_size = 50
    max_page_size = 200
