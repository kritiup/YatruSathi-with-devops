"""User and profile serializers."""

from django.contrib.auth.models import User
from rest_framework import serializers

from ..models import Profile


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source="profile.avatar", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar"]


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "name",
            "email",
            "bio",
            "hobbies",
            "avatar",
            "phone",
            "location",
            "full_name",
            "father_spouse_name",
            "gender",
            "marital_status",
            "date_of_birth",
            "nationality",
            "residential_status",
            "document_type",
            "citizenship_number",
            "document_image",
            "kyc_photo",
            "signature",
            "is_kyc_verified",
            "kyc_status",
            "kyc_submitted_at",
        ]
        # KYC approval state is set by admin review, never by the profile owner.
        read_only_fields = ["is_kyc_verified", "kyc_status", "kyc_submitted_at"]
