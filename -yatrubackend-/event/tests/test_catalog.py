"""Catalogue endpoints: Destinations, Packages, Package bookings, Dashboard."""

import pytest
from django.core.management import call_command

from event.models import ActivityType, Destination, Package

pytestmark = pytest.mark.django_db


@pytest.fixture
def pokhara():
    return Destination.objects.create(
        slug="pokhara", name="Pokhara", tagline="Lakeside Paradise", region="Gandaki"
    )


@pytest.fixture
def trek_package(pokhara):
    return Package.objects.create(
        slug="abc-trek",
        name="Annapurna Base Camp Trek",
        category="trekking",
        destination=pokhara,
        duration_days=10,
        price=32000,
        rating="4.8",
    )


class TestDestinations:
    def test_list_is_public(self, api, pokhara):
        response = api.get("/api/destinations/")
        assert response.status_code == 200
        assert response.data[0]["slug"] == "pokhara"

    def test_detail_by_slug_is_public(self, api, pokhara):
        response = api.get("/api/destinations/pokhara/")
        assert response.status_code == 200
        assert response.data["name"] == "Pokhara"
        assert "activities" in response.data and "packages" in response.data

    def test_region_filter(self, api, pokhara):
        Destination.objects.create(slug="chitwan", name="Chitwan", region="Bagmati")
        assert len(api.get("/api/destinations/?region=Gandaki").data) == 1


class TestPackages:
    def test_list_is_public(self, api, trek_package):
        response = api.get("/api/packages/")
        assert response.status_code == 200
        assert response.data[0]["slug"] == "abc-trek"

    def test_category_filter(self, api, trek_package, pokhara):
        Package.objects.create(
            slug="chitwan-safari",
            name="Chitwan Safari",
            category="wildlife",
            destination=pokhara,
            duration_days=3,
            price=18000,
        )
        trekking = api.get("/api/packages/?category=trekking").data
        assert [p["slug"] for p in trekking] == ["abc-trek"]

    def test_detail_by_slug(self, api, trek_package):
        response = api.get("/api/packages/abc-trek/")
        assert response.status_code == 200
        assert response.data["duration_days"] == 10
        assert "itinerary" in response.data


class TestPackageBooking:
    def test_anonymous_cannot_book(self, api, trek_package):
        response = api.post(
            "/api/package-bookings/", {"package_id": trek_package.id}, format="json"
        )
        assert response.status_code in (401, 403)

    def test_authed_booking_computes_total_price(self, as_participant, trek_package):
        response = as_participant.post(
            "/api/package-bookings/",
            {"package_id": trek_package.id, "participants": 3},
            format="json",
        )
        assert response.status_code == 201
        assert response.data["total_price"] == "96000.00"
        assert response.data["status"] == "pending"

    def test_booking_list_is_scoped_to_caller(
        self, as_participant, as_outsider, trek_package
    ):
        as_participant.post(
            "/api/package-bookings/", {"package_id": trek_package.id}, format="json"
        )
        assert len(as_participant.get("/api/package-bookings/").data) == 1
        assert len(as_outsider.get("/api/package-bookings/").data) == 0


class TestDashboardSummary:
    def test_requires_auth(self, api):
        assert api.get("/api/dashboard/summary/").status_code in (401, 403)

    def test_shape(self, as_participant):
        response = as_participant.get("/api/dashboard/summary/")
        assert response.status_code == 200
        assert set(response.data) >= {
            "trips",
            "favorites",
            "wishlist",
            "reviews",
            "upcoming",
            "recent",
        }


class TestSeedCommand:
    def test_seed_is_idempotent(self):
        call_command("seed_catalog")
        counts = (
            Destination.objects.count(),
            ActivityType.objects.count(),
            Package.objects.count(),
        )
        call_command("seed_catalog")
        assert counts == (
            Destination.objects.count(),
            ActivityType.objects.count(),
            Package.objects.count(),
        )
        assert counts[0] == 6 and counts[1] == 6 and counts[2] == 4
