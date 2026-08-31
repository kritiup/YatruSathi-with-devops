import os
import django
import random
import sys
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.management import call_command

# Setup Django environment
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from event.models import Event, Profile, Booking, Review, Notification

def seed_data():
    # Check if we already have events to avoid redundant seeding
    if Event.objects.exists():
        print("ℹ️ Database already contains events. Skipping seeding.")
        return

    print("🌱 Starting database seeding...")
    
    # Try to load from seed.json first if it exists
    seed_file = os.path.join('data', 'seed.json')
    if os.path.exists(seed_file):
        print(f"📦 Loading initial data from {seed_file}...")
        try:
            call_command('loaddata', seed_file)
            print("✅ Initial data loaded.")
        except Exception as e:
            print(f"⚠️ Error loading seed.json: {e}")

    # Proceed with professional seeding
    # 1. Ensure admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@yatrusathi.com',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        Profile.objects.get_or_create(user=admin_user, defaults={'bio': 'System Administrator'})
        print("✅ Created admin user")

    # 2. Create Sample Users
    usernames = ['trekker_nepal', 'adventure_seeker', 'culture_buff', 'himalayan_guide', 'travel_guru']
    users = []
    for uname in usernames:
        user, created = User.objects.get_or_create(
            username=uname,
            defaults={
                'email': f"{uname}@example.com",
                'first_name': uname.split('_')[0].capitalize(),
                'last_name': uname.split('_')[1].capitalize() if '_' in uname else 'User'
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            Profile.objects.get_or_create(user=user, defaults={'bio': f"Hi, I'm {user.first_name}, a passionate traveler exploring Nepal!"})
        users.append(user)
    print(f"✅ Users ready: {len(users)}")

    # 3. Professional Event Data
    event_data = [
        {
            'title': 'Annapurna Circuit Expedition',
            'description': 'A legendary trek through the heart of the Himalayas. Experience diverse landscapes, from lush sub-tropical forests to alpine meadows and high-altitude deserts.',
            'category': 'Trekking',
            'location': 'Annapurna Region',
            'image': 'event_images/Manang.jpg',
            'tags': 'Adventure, Trekking, Mountains',
            'ticket_price': 1200.00,
            'organizer_name': 'Himalayan Adventures'
        },
        {
            'title': 'Kathmandu Heritage Walk',
            'description': 'Explore the ancient temples, stupas, and palaces of the Kathmandu Valley. A journey through centuries of art, culture, and spirituality.',
            'category': 'Cultural',
            'location': 'Kathmandu',
            'image': 'event_images/Kathmandu.jpg',
            'tags': 'Culture, History, Temples',
            'ticket_price': 45.00,
            'organizer_name': 'Heritage Nepal'
        },
        {
            'title': 'Chitwan Wildlife Safari',
            'description': 'Get close to one-horned rhinos, Bengal tigers, and diverse bird species in the lush jungles of Chitwan National Park.',
            'category': 'Wildlife',
            'location': 'Chitwan',
            'image': 'event_images/image-03.jpg',
            'tags': 'Nature, Animals, Safari',
            'ticket_price': 150.00,
            'organizer_name': 'Jungle Trails'
        },
        {
            'title': 'Everest Base Camp Trek',
            'description': 'Join us for an unforgettable journey to Everest Base Camp. Experience breathtaking mountain views and immerse yourself in Sherpa culture.',
            'location': 'Everest Region, Nepal',
            'category': 'Trekking',
            'image': 'event_images/Everest.jpg',
            'ticket_price': 2500.00,
            'organizer_name': 'Peak Pursuits'
        },
    ]

    created_events = []
    for data in event_data:
        event, created = Event.objects.get_or_create(
            title=data['title'],
            defaults={
                'description': data['description'],
                'category': data.get('category', 'Adventure'),
                'location': data['location'],
                'image': data['image'],
                'tags': data.get('tags', 'Nepal, Travel'),
                'ticket_price': data.get('ticket_price', 0.00),
                'is_free_event': data.get('ticket_price', 0) == 0,
                'organizer_name': data.get('organizer_name', 'Local Nepal Guides'),
                'date': timezone.now() + timedelta(days=random.randint(5, 60)),
                'created_by': admin_user
            }
        )
        created_events.append(event)
    print(f"✅ Events ready: {len(created_events)}")

    # 4. Create Bookings and Reviews
    for user in users:
        for event in random.sample(created_events, k=random.randint(1, len(created_events))):
            Booking.objects.get_or_create(
                user=user,
                event=event,
                defaults={'status': 'confirmed', 'ticket_count': random.randint(1, 2)}
            )
            if random.random() > 0.4:
                Review.objects.get_or_create(
                    user=user,
                    event=event,
                    defaults={
                        'rating': random.randint(4, 5),
                        'comment': "Incredible experience! Highly recommend."
                    }
                )
    print("✅ Bookings and Reviews seeded.")
    print("\n🎉 Database seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
