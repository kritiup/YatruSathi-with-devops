"""Throwaway settings for the one-off SQLite -> Postgres data copy.

`default` stays the normal Postgres database configured by DATABASE_URL, and
this adds a second alias `sqlite` pointing at the legacy `db.sqlite3` file that
the app used before the move to Postgres.

Use it only with `scripts/import_from_sqlite.sh`; it is not for running the app.
"""

import os
from pathlib import Path

from .settings import *  # noqa: F401,F403
from .settings import BASE_DIR, DATABASES

_path = os.environ.get("LEGACY_SQLITE_PATH", str(BASE_DIR / "db.sqlite3"))
if not Path(_path).is_file():
    raise RuntimeError(
        f"No SQLite database at {_path}. Point LEGACY_SQLITE_PATH at the old "
        "db.sqlite3 file, for example:\n"
        "  export LEGACY_SQLITE_PATH=/path/to/db.sqlite3"
    )

DATABASES["sqlite"] = {
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": _path,
    "OPTIONS": {"timeout": 20},
    # Read-only export; no long-lived connection needed.
    "CONN_MAX_AGE": 0,
    "ATOMIC_REQUESTS": False,
    "AUTOCOMMIT": True,
    "TIME_ZONE": None,
    "USER": "",
    "PASSWORD": "",
    "HOST": "",
    "PORT": "",
    "TEST": {},
}
