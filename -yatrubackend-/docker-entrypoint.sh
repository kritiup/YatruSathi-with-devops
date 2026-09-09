#!/usr/bin/env bash
# Container start-up: mirrors scripts/start.sh (Render) — wait for Postgres,
# migrate, seed, serve — but binds Gunicorn to all interfaces and takes
# worker/timeout from the env.
set -euo pipefail

# Compose's `service_healthy` and Kubernetes' RDS endpoint both get us close,
# but a database can still refuse connections for a moment (failover, a cold
# RDS instance, initdb finishing). Block here instead of crash-looping.
echo "==> Waiting for the database"
python - <<'PYTHON'
import os
import sys
import time

import django
from django.db import connections
from django.db.utils import OperationalError

django.setup()

deadline = time.monotonic() + float(os.getenv("DB_WAIT_TIMEOUT", "60"))
attempt = 0
while True:
    attempt += 1
    try:
        connections["default"].ensure_connection()
    except OperationalError as exc:
        if time.monotonic() >= deadline:
            sys.exit(f"    database unreachable after {attempt} attempts: {exc}")
        print(f"    attempt {attempt} failed, retrying in 2s...", flush=True)
        time.sleep(2)
    else:
        print("    database is up")
        break
PYTHON

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
