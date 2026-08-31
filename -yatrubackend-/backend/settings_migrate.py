"""Throwaway settings for a one-off Postgres -> SQLite data copy.

Adds a second database alias `pg` pointing at the Supabase Postgres given by
the SUPABASE_DB_URL environment variable, while `default` stays the normal
SQLite database. Use it only with the export commands in
`scripts/copy_from_supabase.sh`; it is not for running the app.
"""

import os

import dj_database_url

from .settings import *  # noqa: F401,F403
from .settings import DATABASES

_url = os.environ.get("SUPABASE_DB_URL")
if not _url:
    raise RuntimeError(
        "SUPABASE_DB_URL is not set. Example:\n"
        "  export SUPABASE_DB_URL="
        "'postgresql://postgres:PASSWORD@db.jdgzbxycotncnwxusqxy.supabase.co:5432/postgres'"
    )

DATABASES["pg"] = dj_database_url.parse(_url, conn_max_age=0)
DATABASES["pg"].setdefault("OPTIONS", {})
DATABASES["pg"]["OPTIONS"]["sslmode"] = "require"
DATABASES["pg"]["OPTIONS"]["connect_timeout"] = 15
