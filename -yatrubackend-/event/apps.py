from django.apps import AppConfig


class EventConfig(AppConfig):
    name = "event"

    def ready(self):
        # Registers the outbound-email configuration checks.
        from . import checks  # noqa: F401
