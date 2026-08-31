"""Activity listing, creation, and deletion."""

import logging
from typing import List, Optional

from django.contrib.auth.models import User

from ..models import Activity
from ..repositories.activity_repository import ActivityRepository
from .notification_service import NotificationService

logger = logging.getLogger("event")


class ActivityService:
    """Business logic for activities, sitting between views and the repository."""

    def __init__(self):
        self.activity_repo = ActivityRepository()

    def get_all_activities(self) -> List[Activity]:
        return self.activity_repo.get_all_ordered_by_date()

    def get_activity_by_id(self, activity_id: int) -> Optional[Activity]:
        return self.activity_repo.get_by_id(activity_id)

    def create_activity(
        self, user: User, data: dict, gallery_images: list = None
    ) -> Activity:
        activity = self.activity_repo.create(created_by=user, **data)

        for image in gallery_images or []:
            self.activity_repo.create_activity_image(activity, image)

        # Announcing the activity must never fail the creation itself.
        try:
            NotificationService.announce_new_activity(activity)
        except Exception:
            logger.exception(
                "Failed to send new-activity notifications for activity %s",
                activity.id,
            )

        return activity

    def delete_activity(self, activity: Activity) -> None:
        self.activity_repo.delete(activity)
