# Environment Configuration

Phase 1 — do this before adding Docker. Every configurable value the three
services need comes from environment variables. Nothing is hardcoded, and no
real `.env` is ever committed.

## Layout

| File | Committed? | Purpose |
| --- | --- | --- |
| `<service>/.env.example` | yes | Template — every key the service reads, with safe placeholder values |
| `<service>/.env` | **no** (gitignored) | Real local values. Copy from `.env.example`. |
| `./.env.example` → `./.env` | example yes, real no | Root file: docker-compose interpolation only (ports, project name, image tag) |

Services today live in `-yatrubackend-/`, `-yatruSathiFrontend-/`,
`-Yatrusathi-AIchatbot/`; they become `backend/`, `frontend/`, `chatbot/` when
the monorepo is consolidated. The env layout is the same either way.

Each app already loads its own file: Django/Flask via `python-dotenv`
(`load_dotenv()`), the frontend via Vite (`import.meta.env.VITE_*`, inlined at
build time).

## Setup (local, no Docker)

```bash
cp -yatrubackend-/.env.example        -yatrubackend-/.env
cp -yatruSathiFrontend-/.env.example  -yatruSathiFrontend-/.env
cp -Yatrusathi-AIchatbot/.env.example -Yatrusathi-AIchatbot/.env
cp .env.example .env
```

Then fill in real values. At minimum, to boot the backend outside DEBUG you must
set `SECRET_KEY`; to use the admin panel you must set `ADMIN_PASSWORD`.

## Backend — `-yatrubackend-/.env`

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `SECRET_KEY` | yes when `DEBUG=False` | insecure dev key when `DEBUG=True` | `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | no | `False` | `1/true/yes/on` to enable |
| `ALLOWED_HOSTS` | no | `localhost,127.0.0.1,yatrusathi-backend.onrender.com` | comma-separated |
| `CORS_ALLOWED_ORIGINS` | no | built-in localhost + pages.dev list | comma-separated origins |
| `CSRF_TRUSTED_ORIGINS` | no | `https://yatrusathi-backend.onrender.com` | comma-separated |
| `BACKEND_URL` | no | `''` | public base URL, used to build absolute media URLs |
| `ADMIN_EMAIL` | no | `admin@yatrusathi.local` | built-in admin account |
| `ADMIN_PASSWORD` | yes to use admin panel | *none* | unset ⇒ admin login returns 503 |
| `SQLITE_PATH` | no | `<repo>/db.sqlite3` | move the SQLite file elsewhere (e.g. a mounted volume) |
| `RESEND_API_KEY` | no | — | transactional email (OTP); preferred over SMTP |
| `RESEND_FROM_EMAIL` | no | `onboarding@resend.dev` | |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USE_TLS` | no | `smtp.gmail.com` / `587` / `True` | SMTP dev fallback |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` / `DEFAULT_FROM_EMAIL` | no | — | SMTP credentials |
| `SECURE_SSL_REDIRECT` / `SECURE_HSTS_SECONDS` | no | `True` / `31536000` | applied only when `DEBUG=False` |

Storage is SQLite unconditionally — there is no `DATABASE_URL`. (`settings_migrate.py`
and `scripts/copy_from_supabase.sh` are dead Supabase-migration helpers and read
`SUPABASE_DB_URL`; slated for removal.)

Admin JWTs are signed with `SECRET_KEY` (SimpleJWT default) — no separate
`JWT_SECRET`.

## Frontend — `-yatruSathiFrontend-/.env`

Vite inlines these **at build time**, so in Docker they are build args, not
runtime env.

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes | backend API base — must end with `/` |
| `VITE_CHATBOT_URL` | no | AI service URL; blank disables the assistant |
| `VITE_SUPABASE_URL` | no | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | no | anon/publishable key — safe in the browser (RLS enforced); never the service key |

## Chatbot — `-Yatrusathi-AIchatbot/.env`

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `SECRET_KEY` | recommended | `yatrusathi-secret-2024` | Flask session signing |
| `GROQ_API_KEY` | no | `''` | unset ⇒ templated fallback answers from the knowledge base |
| `GROQ_MODEL` | no | `llama-3.3-70b-versatile` | |
| `SUPABASE_URL` / `SUPABASE_KEY` | no | — | optional non-blocking chat logging |

`GOOGLE_API_KEY` / `OLLAMA_MODEL` seen in old `.env` files are **not read by any
code** — leftovers from the original Gemini prototype. Drop them.

## How docker-compose will consume this

Per-service `env_file`, not one shared blob:

```yaml
services:
  backend:
    env_file: ./backend/.env
    ports: ["${BACKEND_PORT}:8000"]
  chatbot:
    env_file: ./chatbot/.env
    ports: ["${CHATBOT_PORT}:5005"]
  frontend:
    build:
      context: ./frontend
      args:                     # Vite needs these at build time
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
        VITE_CHATBOT_URL: ${VITE_CHATBOT_URL}
    ports: ["${FRONTEND_PORT}:80"]
```

The root `./.env` supplies `${BACKEND_PORT}` etc. for interpolation. Add a
`db` (Postgres) service later only if you move the backend off SQLite — that is
a separate decision, out of scope for Phase 1.

## Rotate before production

These were committed and pushed to the public GitHub repos. Rewriting git
history does **not** un-leak them — regenerate each one:

- OpenAI key `sk-proj-A8ETNo1qF3C…` (was in `chatbot/aichatbot.py`, now deleted)
- Google/Gemini API key `AIza…`
- Supabase keys — regenerate the `service_role` key
- Postgres password `Minorproject@123`
- The Gmail app password used for SMTP
