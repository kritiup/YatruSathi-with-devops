from typing import List

from ..models import Activity, ActivityImage
from .base_repository import BaseRepository


class ActivityRepository(BaseRepository[Activity]):
    def __init__(self):
        super().__init__(Activity)

    def get_all_ordered_by_date(self) -> List[Activity]:
        return self.model.objects.all().order_by("-date")

    def create_activity_image(self, activity: Activity, image_file) -> ActivityImage:
        return ActivityImage.objects.create(activity=activity, image=image_file)
