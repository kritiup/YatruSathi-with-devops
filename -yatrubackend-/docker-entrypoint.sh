#!/usr/bin/env bash
# Container start-up: mirrors scripts/start.sh (Render) — migrate, seed, serve —
# but binds Gunicorn to all interfaces and takes worker/timeout from the env.
set -euo pipefail

echo "==> Applying database migrations"
python manage.py migrate --no-input

echo "==> Seeding database (idempotent; non-fatal)"
python scripts/seed_db.py || echo "    seeding skipped/failed — continuing"

echo "==> Starting Gunicorn on 0.0.0.0:${PORT:-8000}"
exec gunicorn backend.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${WEB_CONCURRENCY:-3}" \
    --timeout "${WEB_TIMEOUT:-120}" \
    --access-logfile - \
    --error-logfile -
