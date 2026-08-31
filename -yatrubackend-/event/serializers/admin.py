"""Serializers for the admin KYC review screens."""

from rest_framework import serializers

from ..models import Profile


class KycRequestSerializer(serializers.ModelSerializer):
    """A KYC submission as the admin review table needs it.

    Image fields are emitted as absolute URLs so the admin UI can render them
    from a different origin.
    """

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.SerializerMethodField()
    status = serializers.CharField(source="kyc_status", read_only=True)
    created_at = serializers.DateTimeField(source="kyc_submitted_at", read_only=True)
    document_image = serializers.SerializerMethodField()
    kyc_photo = serializers.SerializerMethodField()
    signature = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "user_id",
            "full_name",
            "email",
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
            "status",
            "is_kyc_verified",
            "created_at",
        ]

    def get_full_name(self, obj):
        return obj.full_name or obj.user.get_full_name() or obj.user.username

    def _absolute(self, image):
        """Absolute URL for an image field, or None if it has no usable file."""
        if not image:
            return None
        request = self.context.get("request")
        try:
            url = image.url
        except ValueError:
            return None
        return request.build_absolute_uri(url) if request else url

    def get_document_image(self, obj):
        return self._absolute(obj.document_image)

    def get_kyc_photo(self, obj):
        return self._absolute(obj.kyc_photo)

    def get_signature(self, obj):
        return self._absolute(obj.signature)
