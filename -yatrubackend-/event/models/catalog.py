"""Catalogue models: Destinations, Activity types, and Packages.

These are the browse-and-discover layer of the site. A :class:`Destination` is
a place (Pokhara, Everest Region); an :class:`ActivityType` is a kind of
experience (Trekking, Rafting); a :class:`Package` is a curated multi-day trip
sold as a single unit. Individual bookable experiences are ``Activity`` rows
(see ``activity.py``), optionally linked to a destination and an activity type.
"""

from django.contrib.auth.models import User
from django.db import models


class Destination(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    tagline = models.CharField(max_length=160, blank=True)  # "Lakeside Paradise"
    description = models.TextField(blank=True)
    region = models.CharField(max_length=120, blank=True)  # used for filtering
    cover_image = models.ImageField(upload_to="destinations/", blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class DestinationImage(models.Model):
    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="destination_gallery/")
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.destination.name}"


class ActivityType(models.Model):
    name = models.CharField(max_length=80)
    slug = models.SlugField(unique=True)
    description = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="activity_types/", blank=True, null=True)
    icon = models.CharField(max_length=60, blank=True)  # optional icon name
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Package(models.Model):
    CATEGORY_CHOICES = (
        ("trekking", "Trekking"),
        ("adventure", "Adventure"),
        ("cultural", "Cultural"),
        ("wildlife", "Wildlife"),
    )

    name = models.CharField(max_length=160)
    slug = models.SlugField(unique=True)
    summary = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="packages/", blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    duration_days = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, default="NPR")
    destination = models.ForeignKey(
        Destination,
        on_delete=models.SET_NULL,
        related_name="packages",
        blank=True,
        null=True,
    )
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    inclusions = models.JSONField(default=list, blank=True)  # list[str]
    exclusions = models.JSONField(default=list, blank=True)  # list[str]
    itinerary = models.JSONField(default=list, blank=True)  # list[{day,title,detail}]
    is_featured = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def __str__(self):
        return self.name


class PackageImage(models.Model):
    package = models.ForeignKey(
        Package, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="package_gallery/")
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.package.name}"


class PackageBooking(models.Model):
    """A booking against a :class:`Package`.

    Kept separate from ``Booking`` (which targets an ``Activity`` and carries
    chat-group / participant-matching side effects) — a package purchase is a
    simpler status-only flow.
    """

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="package_bookings"
    )
    package = models.ForeignKey(
        Package, on_delete=models.CASCADE, related_name="bookings"
    )
    participants = models.PositiveIntegerField(default=1)
    start_date = models.DateField(blank=True, null=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    booked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-booked_at"]

    def __str__(self):
        return f"{self.user.username} - {self.package.name}"
