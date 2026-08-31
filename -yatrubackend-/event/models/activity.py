"""Activity and activity gallery models.

An *Activity* is a single bookable experience (a trek, a rafting trip, a
cultural tour). It was previously called ``Event``; the model and its table
were renamed in migration ``0025``. The Django app is still named ``event``
for migration-history stability — only the model changed.
"""

from django.contrib.auth.models import User
from django.db import models


class Activity(models.Model):
    STATUS_CHOICES = (
        ("upcoming", "Upcoming"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    GENDER_PREFERENCE_CHOICES = (
        ("any", "Any"),
        ("male", "Male Only"),
        ("female", "Female Only"),
    )

    DIFFICULTY_CHOICES = (
        ("easy", "Easy"),
        ("moderate", "Moderate"),
        ("challenging", "Challenging"),
        ("extreme", "Extreme"),
    )

    # --- Core details ---
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateTimeField()
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to="event_images/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="upcoming")
    tags = models.CharField(max_length=255, blank=True, null=True)

    # --- Catalogue placement ---
    destination = models.ForeignKey(
        "Destination",
        on_delete=models.SET_NULL,
        related_name="activities",
        blank=True,
        null=True,
    )
    activity_type = models.ForeignKey(
        "ActivityType",
        on_delete=models.SET_NULL,
        related_name="activities",
        blank=True,
        null=True,
    )

    # --- Trip profile (shown on the activity detail page) ---
    duration = models.CharField(max_length=120, blank=True)  # "1 Day", "5 Days"
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, blank=True)
    max_altitude = models.CharField(max_length=50, blank=True)  # "5,364 m"
    best_season = models.CharField(max_length=120, blank=True)  # "Mar - Jun, Sep - Nov"
    highlights = models.JSONField(default=list, blank=True)  # list[str]

    # --- Schedule ---
    start_date_time = models.DateTimeField(blank=True, null=True)
    end_date_time = models.DateTimeField(blank=True, null=True)

    # --- Location detail ---
    location_name = models.CharField(max_length=255, blank=True, null=True)
    map_link = models.URLField(max_length=500, blank=True, null=True)

    # --- Participation rules ---
    min_participants = models.IntegerField(default=1)
    max_participants = models.IntegerField(blank=True, null=True)
    gender_preference = models.CharField(
        max_length=20, choices=GENDER_PREFERENCE_CHOICES, default="any"
    )
    age_limit = models.IntegerField(blank=True, null=True)
    prior_experience_required = models.BooleanField(default=False)
    equipment_list = models.TextField(blank=True, null=True)

    # --- Money ---
    total_expenses = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    advance_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    is_free_event = models.BooleanField(default=True)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pay_on_site = models.BooleanField(default=False)

    # --- Organizer contact ---
    # Denormalised from the organiser's Profile so an activity keeps the contact
    # details it was published with even if the profile later changes.
    organizer_name = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    social_media_link = models.URLField(max_length=500, blank=True, null=True)

    # --- Relations and audit ---
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="activities_created"
    )
    participants = models.ManyToManyField(
        User, related_name="activities_participating", blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title

    @property
    def is_full(self):
        """True when the activity has a cap and confirmed bookings have reached it."""
        if self.max_participants is None:
            return False
        return self.bookings.filter(status="confirmed").count() >= self.max_participants


class ActivityImage(models.Model):
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="event_gallery/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.activity.title}"
