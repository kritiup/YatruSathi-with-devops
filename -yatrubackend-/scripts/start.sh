#!/usr/bin/env bash

echo "🚀 Starting Django application..."

# Run migrations on startup
echo "🔄 Running database migrations..."
python manage.py migrate --no-input

# Seed database if needed
echo "🌱 Checking/Seeding database..."
python scripts/seed_db.py

# Start gunicorn
echo "✅ Backend ready. Starting Gunicorn..."
exec gunicorn backend.wsgi:application
