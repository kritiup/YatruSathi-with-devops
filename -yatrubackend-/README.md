# YatruSathi Backend API

Django REST Framework backend for the YatruSathi travel platform: auth, activities,
destinations, packages, bookings, reviews, favourites, notifications, group chat,
and admin KYC.

> Part of a three-service workspace — see the [root README](../README.md) for the
> full picture.

## Quick start

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set SECRET_KEY at minimum
python manage.py migrate
python manage.py runserver
```

API: `http://localhost:8000/api/` (versioned alias: `/api/v1/`).
Admin: `http://localhost:8000/admin/` — create a user with `python manage.py createsuperuser`.

## Configuration

Copy `.env.example` to `.env` and fill it in. Every value the app reads is listed there.

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django secret. Required when `DEBUG=False`. |
| `DEBUG` | Defaults to `False`. |
| `ALLOWED_HOSTS` | Comma-separated hostnames. |
| `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` | Browser origins allowed to call the API. |
| `BACKEND_URL` | Public base URL, used to build absolute media URLs. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email for OTP; SMTP vars are the dev fallback. |

### Database

PostgreSQL is required; there is no local-file fallback, so a misconfigured
database fails at startup rather than silently writing to throwaway storage.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Full DSN, e.g. `postgres://user:pass@host:5432/dbname`. Preferred. |
| `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Discrete alternative, used when `DATABASE_URL` is unset. |
| `DB_SSL_REQUIRE` | Require TLS to the database. `True` for RDS, `False` for a local container. |
| `DB_CONN_MAX_AGE` | Seconds to reuse a connection (default `600`); `0` disables persistent connections. |

The quickest local database is the compose one, from the repo root:

```bash
docker compose up -d db
export DATABASE_URL='postgres://yatrusathi:yatrusathi-dev-password@localhost:5432/yatrusathi'
python manage.py migrate
```

Tests need it too — `pytest` creates and drops a `test_…` database on the same
connection, so `DATABASE_URL` must be set (and the role able to create databases).

### Email: OTP and password reset

Signup verification and the three-step forgot-password flow
(`request-otp/` → `verify-otp/` → `reset/`) both send a 6-digit code that
expires in 10 minutes. Delivery tries **Resend over HTTPS first**, then falls
back to Django's email backend.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend key. Unset ⇒ Resend is skipped entirely. |
| `RESEND_FROM_EMAIL` | Sender address. See the sandbox limitation below. |
| `EMAIL_HOST_PASSWORD` etc. | SMTP fallback. Unset ⇒ console backend in `DEBUG`, SMTP in production. |
| `EMAIL_TIMEOUT` | Seconds before the SMTP fallback gives up (default `10`). |

Two things reliably catch people out:

- **The sandbox sender only mails you.** `onboarding@resend.dev` is Resend's
  shared address; Resend refuses (HTTP 403) any recipient other than the account
  that owns the API key. Password reset will work for that one address and fail
  for every real user until you verify a domain at
  [resend.com/domains](https://resend.com/domains) and set `RESEND_FROM_EMAIL`
  to an address on it.
- **`api.resend.com` is behind Cloudflare**, which blocks urllib's default
  `Python-urllib/3.x` user agent with a 403 that never reaches Resend. The
  client therefore sends an explicit `User-Agent`; don't remove it.

In local development with no `RESEND_API_KEY`, the console backend prints the
whole email — including the code — to the backend log, which is usually more
convenient than real delivery.

#### Enabling delivery to real users

1. **Own a domain.** Any registrar works; it does not have to serve the site.
2. **Add it in Resend** → [resend.com/domains](https://resend.com/domains) →
   *Add Domain*. Resend gives you DKIM/SPF records (and optionally DMARC).
3. **Create those DNS records** at your registrar exactly as shown, then press
   *Verify*. Propagation is usually minutes, occasionally up to 48 hours.
4. **Point the app at the new sender** — the address only has to be *on* the
   verified domain; the mailbox need not exist:
   - local / compose: `RESEND_FROM_EMAIL=no-reply@yourdomain.com` in the root `.env`
   - Kubernetes: the same key in `k8s/base/configmap.yaml`
5. **Confirm it actually delivers**, without touching the signup flow:

   ```bash
   python manage.py send_test_email you@somewhere-else.com
   ```

   Use an address that is *not* the Resend account owner's — that is the case
   the sandbox sender fails, so it is the one worth proving.

`python manage.py check` warns (`event.E_email.W001`) whenever `DEBUG=False`
and `RESEND_FROM_EMAIL` is still the sandbox address, so a deploy cannot quietly
go out with password reset broken for everyone but you.

### Seeding

`scripts/seed_db.py` runs on every container start (and from `scripts/start.sh`
on Render), so it is idempotent and never creates credentials in production:

- **Catalogue** — destinations, activity types, activities and packages, via the
  `seed_catalog` management command. Applied only when the catalogue is empty,
  so re-running it will not revert edits made through the admin. `SEED_FORCE=1`
  re-applies it.
- **Demo users, bookings and reviews** — opt-in with `SEED_DEMO_DATA=1`, and
  ignored unless `DEBUG=True`. Password comes from `SEED_DEMO_PASSWORD`.

The admin panel is not seeded: it authenticates against `ADMIN_EMAIL` /
`ADMIN_PASSWORD` (see `event/api/admin_login.py`) and needs no database row.

```bash
python scripts/seed_db.py                    # catalogue only
SEED_DEMO_DATA=1 python scripts/seed_db.py   # + demo logins (DEBUG=True only)
```

### Moving an existing SQLite database over

`scripts/import_from_sqlite.sh` is a one-off copy of every row from a legacy
`db.sqlite3` into Postgres. It migrates the target schema, dumps with natural
keys, loads, and resets the Postgres primary-key sequences so later inserts
don't collide with the imported rows:

```bash
export DATABASE_URL='postgres://…'          # target Postgres
export LEGACY_SQLITE_PATH=./db.sqlite3      # optional; this is the default
bash scripts/import_from_sqlite.sh
```

## Authentication

User endpoints use DRF token auth; admins use a separate JWT scheme. Send the token on
each request:

```
Authorization: Token <your-token>
```

Obtain one from `POST /api/auth/login/` or `POST /api/auth/signup/`.

## Endpoints

Base prefix `/api/` or `/api/v1/`.

| Group | Paths |
| --- | --- |
| Auth | `auth/signup/`, `auth/login/`, `auth/logout/`, `auth/verify-otp/`, `auth/resend-otp/`, `auth/forgot-password/{request-otp,verify-otp,reset}/` |
| Activities | `activities/`, `activities/{id}/`, `activities/{id}/reviews/`, `activities/{id}/chat/` (legacy `events/…` aliases still resolve) |
| Catalogue | `destinations/`, `destinations/{slug}/`, `activity-types/`, `packages/`, `packages/{slug}/`, `package-bookings/`, `dashboard/summary/` |
| Bookings | `bookings/`, `bookings/{id}/`, `bookings/{id}/action/` |
| Social | `reviews/`, `favorites/`, `favorites/{activity_id}/` |
| Notifications | `notifications/`, `notifications/unread-count/`, `notifications/mark-read/`, `notifications/{id}/` |
| Group chat | `groups/`, `groups/{id}/`, `groups/{id}/{mark-read,add-member,remove-member}/`, `groups/{id}/chat/` |
| Admin | `admin/login/`, `admin/kyc-requests/`, `admin/kyc-stats/`, `admin/kyc-requests/{profile_id}/` |
| Users | `users/`, `users/{id}/profile/`, `profile/` |

## Testing

```bash
pytest
```

## Project structure

```
backend/            Django project (settings, urls, wsgi/asgi)
event/
├── models/         Domain models by area (auth, catalog, booking, chat, social, …)
├── serializers/    DRF serializers by domain
├── views/          Class-based views by domain
├── api/            Function views for auth / admin / OTP flows
├── services/       Business logic
├── repositories/   Data-access helpers
├── authentication.py   AdminJWTAuthentication
├── middleware.py
└── tests/          pytest suite
scripts/            build.sh / start.sh / seed_db.py (Render)
requirements/       base.txt · dev.txt · prod.txt
```

## Entity relationships

```mermaid
erDiagram
    User ||--o| Profile : "has"
    User ||--o{ Activity : "creates"
    User ||--o{ Booking : "makes"
    User ||--o{ Favorite : "likes"
    User ||--o{ Review : "writes"
    User ||--o{ ChatMessage : "sends"
    User ||--o{ Notification : "receives"

    Activity ||--o{ EventImage : "has"
    Activity ||--o{ Booking : "receives"
    Activity ||--o{ Favorite : "favorited_by"
    Activity ||--o{ Review : "has"
    Activity ||--o{ ChatMessage : "has"
    Activity }o--o{ User : "participants"
```

## Deployment

Configured for Render via `render.yaml`: `scripts/build.sh` installs, collects static
and migrates; `scripts/start.sh` migrates, seeds, and starts Gunicorn. Set
`DATABASE_URL` to a managed Postgres instance there — Render's filesystem is
ephemeral, and the app has no local-file storage to fall back on.

In containers, `docker-entrypoint.sh` waits for the database to accept
connections (`DB_WAIT_TIMEOUT`, default 60s) before migrating, so a cold or
failing-over database delays start-up instead of crash-looping the pod.
