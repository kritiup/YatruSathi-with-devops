#!/usr/bin/env bash
#
# One-off copy of all row data from the Supabase Postgres database into the
# local SQLite database (db.sqlite3).
#
# Prerequisites:
#   1. A working Supabase connection URI. Get it from the dashboard:
#        Project Settings -> Database -> Connection string -> URI
#      (reset the database password there if you don't have it). Then:
#        export SUPABASE_DB_URL='postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres'
#   2. The Postgres client libraries, needed only for this export:
#        pip install psycopg2-binary dj-database-url
#
# Run from the repo root:  bash scripts/copy_from_supabase.sh
#
set -o errexit
set -o pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL first (see the header of this script)}"

SETTINGS=backend.settings_migrate
DUMP="$(mktemp -t supabase_dump_XXXX).json"

echo "==> Ensuring the SQLite schema is up to date"
python manage.py migrate --noinput

echo "==> Dumping data from Supabase Postgres"
# Natural keys keep FKs consistent across the copy. Django-managed tables that
# must not be copied (they are recreated by migrate, or are per-session) are
# excluded.
python manage.py dumpdata \
  --settings="$SETTINGS" \
  --database=pg \
  --natural-primary --natural-foreign \
  --exclude contenttypes \
  --exclude auth.permission \
  --exclude admin.logentry \
  --exclude sessions.session \
  --indent 2 \
  --output "$DUMP"

echo "==> Loading data into SQLite (db.sqlite3)"
python manage.py loaddata --settings="$SETTINGS" "$DUMP"

echo "==> Done. Dump kept at: $DUMP"
echo "    Row counts now in SQLite:"
python manage.py shell -c "
from django.apps import apps
for m in apps.get_models():
    try:
        print(f'  {m._meta.label:35} {m.objects.count()}')
    except Exception as e:
        print(f'  {m._meta.label:35} (skipped: {e})')
"
