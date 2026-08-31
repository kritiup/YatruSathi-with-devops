"""Seed the browse catalogue with the launch content for YatruSathi.

Idempotent: every row is keyed by its slug via ``get_or_create`` / ``update_or_create``,
so running the command repeatedly leaves the database in the same state.

    python manage.py seed_catalog

Images are intentionally left blank — the frontend ships bundled artwork keyed
by slug and falls back to it when ``cover_image`` is empty.
"""

from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from event.models import Activity, ActivityType, Destination, Package

DESTINATIONS = [
    {
        "slug": "pokhara",
        "name": "Pokhara",
        "tagline": "Lakeside Paradise",
        "region": "Gandaki",
        "description": (
            "Nepal’s adventure capital, cradled between the Phewa Lake and the "
            "Annapurna massif. The launchpad for treks, paragliding and lazy "
            "lakeside mornings."
        ),
        "is_featured": True,
        "sort_order": 1,
    },
    {
        "slug": "kathmandu",
        "name": "Kathmandu",
        "tagline": "Cultural Heart",
        "region": "Bagmati",
        "description": (
            "A living museum of medieval squares, stupas and temples, wrapped in "
            "the noise and colour of Nepal’s capital."
        ),
        "is_featured": True,
        "sort_order": 2,
    },
    {
        "slug": "mustang",
        "name": "Mustang",
        "tagline": "The Last Forbidden Kingdom",
        "region": "Gandaki",
        "description": (
            "A high desert of ochre cliffs and whitewashed Tibetan-Buddhist "
            "villages in the rain shadow of the Himalaya."
        ),
        "is_featured": True,
        "sort_order": 3,
    },
    {
        "slug": "chitwan",
        "name": "Chitwan",
        "tagline": "Wildlife Adventure",
        "region": "Bagmati",
        "description": (
            "Nepal’s first national park — lowland jungle and grassland "
            "home to one-horned rhino, gharial and the Bengal tiger."
        ),
        "is_featured": True,
        "sort_order": 4,
    },
    {
        "slug": "everest-region",
        "name": "Everest Region",
        "tagline": "Top of the World",
        "region": "Koshi",
        "description": (
            "The Khumbu — Sherpa homeland, spinning prayer wheels and the "
            "trail to the foot of the highest mountain on earth."
        ),
        "is_featured": True,
        "sort_order": 5,
    },
    {
        "slug": "lumbini",
        "name": "Lumbini",
        "tagline": "Birthplace of the Buddha",
        "region": "Lumbini",
        "description": (
            "A UNESCO World Heritage pilgrimage site on the Terai plains, where "
            "Siddhartha Gautama was born in 623 BCE."
        ),
        "is_featured": False,
        "sort_order": 6,
    },
]

ACTIVITY_TYPES = [
    {
        "slug": "trekking",
        "name": "Trekking",
        "icon": "Hiking",
        "description": "Multi-day walks through the world’s highest mountains.",
        "sort_order": 1,
    },
    {
        "slug": "rafting",
        "name": "Rafting",
        "icon": "Kayaking",
        "description": "White-water runs on Himalayan-fed rivers.",
        "sort_order": 2,
    },
    {
        "slug": "paragliding",
        "name": "Paragliding",
        "icon": "Paragliding",
        "description": "Tandem flights over lakes and foothills.",
        "sort_order": 3,
    },
    {
        "slug": "cultural-tour",
        "name": "Cultural Tour",
        "icon": "TempleBuddhist",
        "description": "Guided walks through temples, squares and old towns.",
        "sort_order": 4,
    },
    {
        "slug": "camping",
        "name": "Camping",
        "icon": "Cabin",
        "description": "Nights under canvas in the high country.",
        "sort_order": 5,
    },
    {
        "slug": "jungle-safari",
        "name": "Jungle Safari",
        "icon": "Pets",
        "description": "Jeep and canoe safaris in lowland national parks.",
        "sort_order": 6,
    },
]

# (slug, title, destination slug, activity-type slug, extra fields)
ACTIVITIES = [
    (
        "trishuli-river-rafting",
        "Trishuli River Rafting",
        "pokhara",
        "rafting",
        {
            "location": "Trishuli River, Nepal",
            "category": "Adventure",
            "duration": "1 Day",
            "difficulty": "moderate",
            "max_altitude": "",
            "best_season": "Mar - Jun, Sep - Nov",
            "ticket_price": 2500,
            "is_free_event": False,
            "min_participants": 2,
            "max_participants": 12,
            "highlights": [
                "Exciting rapids and safe adventure",
                "Professional guides and safety equipment",
                "Beautiful natural scenery",
                "Suitable for beginners",
            ],
            "description": (
                "Experience the thrill of white-water rafting on the Trishuli "
                "River. Perfect for beginners and adventure lovers, this day trip "
                "offers stunning scenery and exciting rapids."
            ),
        },
    ),
    (
        "annapurna-foothills-day-hike",
        "Annapurna Foothills Day Hike",
        "pokhara",
        "trekking",
        {
            "location": "Pokhara, Nepal",
            "category": "Trekking",
            "duration": "1 Day",
            "difficulty": "easy",
            "best_season": "Oct - Apr",
            "ticket_price": 1800,
            "is_free_event": False,
            "highlights": [
                "Sunrise views of Machapuchare",
                "Terraced hillside villages",
                "Local tea-house lunch included",
            ],
            "description": (
                "A gentle introduction to trekking in the Annapurna foothills, "
                "with panoramic mountain views and a village lunch stop."
            ),
        },
    ),
    (
        "phewa-lake-tandem-paragliding",
        "Phewa Lake Tandem Paragliding",
        "pokhara",
        "paragliding",
        {
            "location": "Sarangkot, Pokhara",
            "category": "Adventure",
            "duration": "30 - 45 min",
            "difficulty": "easy",
            "best_season": "Sep - Nov, Feb - Apr",
            "ticket_price": 9000,
            "is_free_event": False,
            "highlights": [
                "Take off from Sarangkot ridge",
                "Bird’s-eye view of Phewa Lake",
                "Certified tandem pilots",
            ],
            "description": (
                "Soar over Phewa Lake with a certified tandem pilot, launching "
                "from the Sarangkot ridge with the Annapurnas as a backdrop."
            ),
        },
    ),
    (
        "kathmandu-heritage-walk",
        "Kathmandu Heritage Walk",
        "kathmandu",
        "cultural-tour",
        {
            "location": "Kathmandu Durbar Square",
            "category": "Cultural",
            "duration": "Half Day",
            "difficulty": "easy",
            "best_season": "All year",
            "ticket_price": 1200,
            "is_free_event": False,
            "highlights": [
                "Kathmandu Durbar Square",
                "Hidden courtyards and shrines",
                "Local Newari guide",
            ],
            "description": (
                "A guided walk through the medieval core of Kathmandu, from "
                "Durbar Square into the courtyards tourists usually miss."
            ),
        },
    ),
    (
        "chitwan-jungle-safari",
        "Chitwan Jungle Safari",
        "chitwan",
        "jungle-safari",
        {
            "location": "Chitwan National Park",
            "category": "Wildlife",
            "duration": "2 Days",
            "difficulty": "easy",
            "best_season": "Oct - Mar",
            "ticket_price": 14000,
            "is_free_event": False,
            "min_participants": 2,
            "highlights": [
                "Jeep safari for rhino and deer",
                "Dugout canoe on the Rapti River",
                "Tharu cultural evening",
            ],
            "description": (
                "Two days in Chitwan National Park by jeep and canoe, tracking "
                "one-horned rhino and, if you are lucky, the Bengal tiger."
            ),
        },
    ),
    (
        "everest-view-trek",
        "Everest View Trek",
        "everest-region",
        "trekking",
        {
            "location": "Khumbu, Nepal",
            "category": "Trekking",
            "duration": "7 Days",
            "difficulty": "challenging",
            "max_altitude": "3,880 m",
            "best_season": "Mar - May, Oct - Nov",
            "ticket_price": 48000,
            "is_free_event": False,
            "min_participants": 2,
            "max_participants": 10,
            "highlights": [
                "Fly in and out of Lukla",
                "Namche Bazaar acclimatisation day",
                "Sunrise from Hotel Everest View",
            ],
            "description": (
                "A week in the Khumbu that reaches the classic Everest viewpoint "
                "above Namche without the full Base Camp commitment."
            ),
        },
    ),
]

# (slug, name, category, destination slug, duration_days, price, rating, review_count)
PACKAGES = [
    (
        "annapurna-base-camp-trek",
        "Annapurna Base Camp Trek",
        "trekking",
        "pokhara",
        10,
        32000,
        4.8,
        530,
        "Trek into the Annapurna Sanctuary, a glacial amphitheatre ringed by "
        "seven-thousand-metre peaks.",
    ),
    (
        "everest-base-camp-trek",
        "Everest Base Camp Trek",
        "trekking",
        "everest-region",
        14,
        65000,
        4.9,
        410,
        "The classic trek to the foot of Everest, through Sherpa country and the "
        "Khumbu icefall viewpoint at Kala Patthar.",
    ),
    (
        "upper-mustang-tour",
        "Upper Mustang Tour",
        "cultural",
        "mustang",
        8,
        28000,
        4.7,
        190,
        "A restricted-area journey into the walled city of Lo Manthang and the "
        "cave monasteries of the old kingdom of Lo.",
    ),
    (
        "chitwan-wildlife-escape",
        "Chitwan Wildlife Escape",
        "wildlife",
        "chitwan",
        4,
        18000,
        4.6,
        240,
        "A short break in Chitwan National Park with jeep safaris, river canoeing "
        "and a Tharu village stay.",
    ),
]

ITINERARY_STUB = [
    {
        "day": 1,
        "title": "Arrival & briefing",
        "detail": "Meet the team, gear check, overnight in town.",
    },
    {
        "day": 2,
        "title": "Trek begins",
        "detail": "First day on the trail with a support crew.",
    },
]
INCLUSIONS_STUB = [
    "Licensed English-speaking guide",
    "All permits and park fees",
    "Tea-house or lodge accommodation",
    "Breakfast, lunch and dinner on the trail",
]
EXCLUSIONS_STUB = [
    "International flights",
    "Travel insurance",
    "Personal trekking gear",
    "Tips for guides and porters",
]


class Command(BaseCommand):
    help = "Seed Destinations, Activity types, sample Activities and Packages."

    def handle(self, *args, **options):
        organiser = self._organiser()

        destinations = {}
        for row in DESTINATIONS:
            obj, _ = Destination.objects.update_or_create(
                slug=row["slug"], defaults=row
            )
            destinations[row["slug"]] = obj

        types = {}
        for row in ACTIVITY_TYPES:
            obj, _ = ActivityType.objects.update_or_create(
                slug=row["slug"], defaults=row
            )
            types[row["slug"]] = obj

        base_date = timezone.now() + timedelta(days=21)
        for order, (slug, title, dest_slug, type_slug, extra) in enumerate(ACTIVITIES):
            defaults = {
                "title": title,
                "created_by": organiser,
                "destination": destinations.get(dest_slug),
                "activity_type": types.get(type_slug),
                "date": base_date + timedelta(days=order * 3),
                "status": "upcoming",
                "organizer_name": "YatruSathi",
                "contact_email": "hello@yatrusathi.local",
                "description": extra.get("description", title),
                "location": extra.get("location", ""),
                "category": extra.get("category", ""),
                "duration": extra.get("duration", ""),
                "difficulty": extra.get("difficulty", ""),
                "max_altitude": extra.get("max_altitude", ""),
                "best_season": extra.get("best_season", ""),
                "highlights": extra.get("highlights", []),
                "ticket_price": extra.get("ticket_price", 0),
                "is_free_event": extra.get("is_free_event", True),
                "min_participants": extra.get("min_participants", 1),
                "max_participants": extra.get("max_participants"),
            }
            Activity.objects.update_or_create(
                title=title, created_by=organiser, defaults=defaults
            )

        for order, (
            slug,
            name,
            category,
            dest_slug,
            days,
            price,
            rating,
            reviews,
            summary,
        ) in enumerate(PACKAGES):
            Package.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "category": category,
                    "destination": destinations.get(dest_slug),
                    "duration_days": days,
                    "price": price,
                    "currency": "NPR",
                    "rating": rating,
                    "review_count": reviews,
                    "summary": summary,
                    "description": summary,
                    "itinerary": ITINERARY_STUB,
                    "inclusions": INCLUSIONS_STUB,
                    "exclusions": EXCLUSIONS_STUB,
                    "is_featured": order < 3,
                    "sort_order": order + 1,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded catalogue: "
                f"{Destination.objects.count()} destinations, "
                f"{ActivityType.objects.count()} activity types, "
                f"{Activity.objects.count()} activities, "
                f"{Package.objects.count()} packages."
            )
        )

    def _organiser(self) -> User:
        user, created = User.objects.get_or_create(
            username="catalog",
            defaults={"email": "catalog@yatrusathi.local", "is_staff": True},
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])
        return user
