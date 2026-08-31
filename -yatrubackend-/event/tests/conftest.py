"""Shared fixtures for the API test suite."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from event.models import Activity, Booking


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def organizer(db):
    return User.objects.create_user(
        username="organizer", email="organizer@gmail.com", password="pw-organizer-1"
    )


@pytest.fixture
def participant(db):
    return User.objects.create_user(
        username="participant", email="participant@gmail.com", password="pw-part-1"
    )


@pytest.fixture
def outsider(db):
    return User.objects.create_user(
        username="outsider", email="outsider@gmail.com", password="pw-outsider-1"
    )


def _authed(user):
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def as_organizer(organizer):
    return _authed(organizer)


@pytest.fixture
def as_participant(participant):
    return _authed(participant)


@pytest.fixture
def as_outsider(outsider):
    return _authed(outsider)


@pytest.fixture
def activity(organizer):
    return Activity.objects.create(
        title="Annapurna Base Camp Trek",
        description="A seven day trek.",
        date=timezone.now() + timedelta(days=30),
        location="Pokhara",
        created_by=organizer,
    )


@pytest.fixture
def booking(activity, participant):
    return Booking.objects.create(user=participant, activity=activity)
