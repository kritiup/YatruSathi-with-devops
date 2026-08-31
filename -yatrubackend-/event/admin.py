from django.contrib import admin

from .models import (
    Activity,
    ActivityType,
    Booking,
    ChatMessage,
    Destination,
    DestinationImage,
    Favorite,
    Notification,
    Package,
    PackageBooking,
    PackageImage,
    Profile,
    Review,
)


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "location",
        "date",
        "ticket_price",
        "created_by",
    )
    list_filter = ("category", "status", "difficulty", "date", "created_by")
    search_fields = ("title", "description", "location")
    date_hierarchy = "date"
    list_select_related = ("created_by", "destination", "activity_type")


class DestinationImageInline(admin.TabularInline):
    model = DestinationImage
    extra = 1


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "is_featured", "sort_order")
    list_filter = ("is_featured", "region")
    search_fields = ("name", "region", "tagline")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [DestinationImageInline]


@admin.register(ActivityType)
class ActivityTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "sort_order")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


class PackageImageInline(admin.TabularInline):
    model = PackageImage
    extra = 1


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "duration_days", "price", "is_featured")
    list_filter = ("category", "is_featured")
    search_fields = ("name", "summary", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [PackageImageInline]


@admin.register(PackageBooking)
class PackageBookingAdmin(admin.ModelAdmin):
    list_display = ("user", "package", "participants", "status", "booked_at")
    list_filter = ("status", "booked_at")
    search_fields = ("user__username", "package__name")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "location", "phone")
    search_fields = ("user__username", "user__email", "location")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("user", "activity", "status", "booked_at")
    list_filter = ("status", "booked_at")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "activity", "rating", "created_at")
    list_filter = ("rating", "created_at")


admin.site.register(ChatMessage)
admin.site.register(Notification)
admin.site.register(Favorite)
