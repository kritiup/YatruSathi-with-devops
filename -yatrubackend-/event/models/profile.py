"""User profile, including KYC submission fields."""

from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    GENDER_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    )
    MARITAL_STATUS_CHOICES = (
        ("single", "Single"),
        ("married", "Married"),
    )
    RESIDENTIAL_STATUS_CHOICES = (
        ("resident", "Resident Individual"),
        ("non_resident", "Non Resident"),
        ("foreign_national", "Foreign National"),
    )
    DOCUMENT_TYPE_CHOICES = (
        ("nid", "National ID (NID)"),
        ("passport", "Passport"),
        ("voter_id", "Voter ID"),
        ("driving_license", "Driving License"),
        ("other", "Other"),
    )
    KYC_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # --- Public profile ---
    bio = models.TextField(blank=True)
    hobbies = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)

    # --- Account recovery ---
    password_reset_token = models.CharField(max_length=128, blank=True, null=True)

    # --- KYC identity ---
    full_name = models.CharField(max_length=255, blank=True)
    father_spouse_name = models.CharField(max_length=255, blank=True)
    gender = models.CharField(
        max_length=20, choices=GENDER_CHOICES, blank=True, null=True
    )
    marital_status = models.CharField(
        max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, null=True
    )
    date_of_birth = models.DateField(blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True)
    residential_status = models.CharField(
        max_length=50, choices=RESIDENTIAL_STATUS_CHOICES, blank=True, null=True
    )

    # --- KYC documents ---
    document_type = models.CharField(
        max_length=50, choices=DOCUMENT_TYPE_CHOICES, blank=True, null=True
    )
    citizenship_number = models.CharField(max_length=50, blank=True)
    document_image = models.ImageField(upload_to="kyc_docs/", blank=True, null=True)
    kyc_photo = models.ImageField(upload_to="kyc_photos/", blank=True, null=True)
    signature = models.ImageField(upload_to="kyc_signatures/", blank=True, null=True)

    # --- KYC review state ---
    is_kyc_verified = models.BooleanField(default=False)
    kyc_status = models.CharField(
        max_length=20, choices=KYC_STATUS_CHOICES, default="pending"
    )
    kyc_submitted_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
