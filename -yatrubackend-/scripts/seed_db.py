"""Seed the database. Safe to run on every container start.

Called by ``docker-entrypoint.sh`` and ``scripts/start.sh``, so it must be
idempotent and must never create credentials in production.

Two separate things happen here:

1. **Catalogue content** — destinations, activity types, activities and
   packages — via the ``seed_catalog`` management command. Only on an empty
   catalogue, so re-running it never reverts edits made through the admin.
   Set ``SEED_FORCE=1`` to re-apply it over existing rows.

2. **Demo users, bookings and reviews** — opt-in, local only. Requires
   ``SEED_DEMO_DATA=1`` *and* ``DEBUG=True``; it refuses to create accounts
   when ``DEBUG=False`` so a production pod can never seed logins.

The admin panel is not seeded here at all: it authenticates against the
ADMIN_EMAIL / ADMIN_PASSWORD environment variables (see
``event/api/admin_login.py``) and needs no database row.

    python scripts/seed_db.py
"""

import os
import random
import sys

import django

sys.path.insert(0, os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.conf import settings  # noqa: E402
from django.contrib.auth.models import User  # noqa: E402
from django.core.management import call_command  # noqa: E402

from event.models import Activity, Booking, Destination, Profile, Review  # noqa: E402

DEMO_USERNAMES = [
    "trekker_nepal",
    "adventure_seeker",
    "culture_buff",
    "himalayan_guide",
    "travel_guru",
]

DEMO_COMMENTS = [
    "Incredible experience — the guides really knew the trails.",
    "Well organised from start to finish. Would book again.",
    "Tough going in places, but the views more than made up for it.",
    "Great group, great food, unforgettable scenery.",
]


def env_bool(name, default=False):
    """Read a boolean from the environment, accepting the usual spellings."""
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


def seed_catalogue():
    """Load the browse catalogue, unless it is already populated."""
    if Destination.objects.exists() and not env_bool("SEED_FORCE"):
        print("ℹ️  Catalogue already seeded — skipping (SEED_FORCE=1 to re-apply).")
        return

    print("🌱 Seeding catalogue...")
    call_command("seed_catalog")


def seed_demo_data():
    """Create demo logins plus a few bookings and reviews. Local only."""
    if not env_bool("SEED_DEMO_DATA"):
        return

    if not settings.DEBUG:
        print(
            "⚠️  SEED_DEMO_DATA is set but DEBUG=False — refusing to create demo "
            "accounts outside local development."
        )
        return

    password = os.getenv("SEED_DEMO_PASSWORD", "demo-password-change-me")

    users = []
    for username in DEMO_USERNAMES:
        first, _, last = username.partition("_")
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.com",
                "first_name": first.capitalize(),
                "last_name": last.capitalize() or "User",
            },
        )
        if created:
            user.set_password(password)
            user.save(update_fields=["password"])
            Profile.objects.get_or_create(
                user=user,
                defaults={
                    "bio": f"Hi, I'm {user.first_name}, exploring Nepal one trail "
                    "at a time!"
                },
            )
        users.append(user)
    print(f"✅ Demo users ready: {len(users)} (password: {password!r})")

    activities = list(Activity.objects.all()[:10])
    if not activities:
        print("ℹ️  No activities to book against — skipping bookings and reviews.")
        return

    # Seeded RNG so repeated runs produce the same spread rather than slowly
    # booking every user onto every activity.
    rng = random.Random(20260909)
    bookings = reviews = 0
    for user in users:
        chosen = rng.sample(activities, k=min(len(activities), rng.randint(1, 3)))
        for activity in chosen:
            _, created = Booking.objects.get_or_create(
                user=user,
                activity=activity,
                defaults={"status": "confirmed", "ticket_count": rng.randint(1, 2)},
            )
            bookings += int(created)

            if rng.random() <= 0.6:
                _, created = Review.objects.get_or_create(
                    user=user,
                    activity=activity,
                    rated_user=None,
                    defaults={
                        "rating": rng.randint(4, 5),
                        "comment": rng.choice(DEMO_COMMENTS),
                    },
                )
                reviews += int(created)
    print(f"✅ Demo bookings created: {bookings}, reviews created: {reviews}")


def seed_data():
    seed_catalogue()
    seed_demo_data()
    print("🎉 Seeding complete.")


if __name__ == "__main__":
    seed_data()
