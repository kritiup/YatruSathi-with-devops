#!/usr/bin/env bash
#
# One-off copy of all row data from the legacy SQLite database (db.sqlite3)
# into the Postgres database the app now runs on.
#
# Prerequisites:
#   1. DATABASE_URL (or the POSTGRES_* variables) pointing at the target
#      Postgres database — the same ones the app uses. For the compose stack:
#        export DATABASE_URL='postgres://yatrusathi:yatrusathi-dev-password@localhost:5432/yatrusathi'
#   2. The old SQLite file. Defaults to ./db.sqlite3; override with:
#        export LEGACY_SQLITE_PATH=/path/to/db.sqlite3
#
# Run from the backend directory:  bash scripts/import_from_sqlite.sh
#
set -o errexit
set -o pipefail

SETTINGS=backend.settings_migrate
DUMP="$(mktemp -t sqlite_dump_XXXX).json"

echo "==> Ensuring the Postgres schema is up to date"
python manage.py migrate --noinput

echo "==> Dumping data from the legacy SQLite database"
# Natural keys keep FKs consistent across the copy. Django-managed tables that
# must not be copied (they are recreated by migrate, or are per-session) are
# excluded.
python manage.py dumpdata \
  --settings="$SETTINGS" \
  --database=sqlite \
  --natural-primary --natural-foreign \
  --exclude contenttypes \
  --exclude auth.permission \
  --exclude admin.logentry \
  --exclude sessions.session \
  --indent 2 \
  --output "$DUMP"

echo "==> Loading data into Postgres"
python manage.py loaddata --settings="$SETTINGS" --database=default "$DUMP"

# Postgres sequences are not advanced by explicit-pk inserts the way SQLite's
# implicit rowid is, so the next INSERT would collide with a loaded row.
echo "==> Resetting Postgres primary-key sequences"
python manage.py sqlsequencereset auth event | python manage.py dbshell

echo "==> Done. Dump kept at: $DUMP"
echo "    Row counts now in Postgres:"
python manage.py shell -c "
from django.apps import apps
for m in apps.get_models():
    try:
        print(f'  {m._meta.label:35} {m.objects.count()}')
    except Exception as e:
        print(f'  {m._meta.label:35} (skipped: {e})')
"
