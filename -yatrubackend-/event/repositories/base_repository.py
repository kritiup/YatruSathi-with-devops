from typing import Generic, List, Optional, Type, TypeVar

from django.db import models

T = TypeVar("T", bound=models.Model)


class BaseRepository(Generic[T]):
    """
    Base repository class for standard CRUD operations using Django ORM.
    This helps in decoupling business logic from the ORM.
    """

    def __init__(self, model: Type[T]):
        self.model = model

    def get_all(self) -> List[T]:
        return self.model.objects.all()

    def get_by_id(self, id: int) -> Optional[T]:
        try:
            return self.model.objects.get(id=id)
        except self.model.DoesNotExist:
            return None

    def create(self, **fields) -> T:
        return self.model.objects.create(**fields)

    def update(self, instance: T, **fields) -> T:
        for field, value in fields.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    def delete(self, instance: T):
        instance.delete()
