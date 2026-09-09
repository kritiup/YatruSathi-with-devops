# YatruSathi

Smart tourism and group‑travel platform for Nepal. Travellers discover destinations,
activities and packages, form travel groups, book trips, review them, and chat in
real time — with an AI travel assistant answering questions along the way.

This repository is a workspace of three independently deployable services:

| Directory | Service | Stack |
| --- | --- | --- |
| [`-yatrubackend-/`](-yatrubackend-) | REST API & data model | Django 6, Django REST Framework, PostgreSQL 16 |
| [`-yatruSathiFrontend-/`](-yatruSathiFrontend-) | Web client | React 19, TypeScript, Vite 7, MUI 6 |
| [`-Yatrusathi-AIchatbot/`](-Yatrusathi-AIchatbot) | AI assistant & real‑time chat | Flask, Flask‑SocketIO, Groq (Llama 3.3 70B) |

---

## Architecture

A classic **three‑tier** application, with an AI side‑car alongside the
application tier:

| Tier | Component | Runs as |
| --- | --- | --- |
| Presentation | React SPA (static bundle) | nginx container / CDN |
| Application | Django REST API | Gunicorn container |
| Data | PostgreSQL 16 | `db` container locally, Amazon RDS on EKS |

Only the application tier reaches the database — the browser never does.

```mermaid
flowchart LR
    User((User)) --> FE[React SPA<br/>Vite / MUI]
    FE -- REST + Token auth --> BE[Django REST API]
    FE -- REST / SSE stream --> AI[Flask AI service]
    FE -- Socket.IO --> AI
    BE -- psycopg --> DB[(PostgreSQL)]
    AI -- RAG --> KB[knowledge_base.py]
    AI -- LLM --> GROQ[Groq Cloud]
    AI -. optional logging .-> SB[(Supabase)]
```

- The **frontend** is the only thing users talk to. It calls the Django API for all
  persistent data (auth, events, bookings, reviews, notifications, group chat history)
  and the Flask service for AI replies and live chat sockets.
- The **backend** owns the domain model and authentication. It uses DRF token
  authentication for users and a separate JWT scheme for admins.
- The **database** is PostgreSQL, reachable only from the backend. It is the
  single source of truth for persistent state; the API containers stay stateless
  so they can be scaled and replaced freely.
- The **AI service** is stateless apart from short‑lived in‑memory session history.
  It answers with Retrieval‑Augmented Generation over a bundled Nepal travel
  knowledge base, falling back to templated answers when no Groq key is configured.

---

## Prerequisites

- **Python 3.11** (backend and AI service)
- **Node.js 20+** and npm (frontend)
- **PostgreSQL 16** (backend) — or just Docker, and use `docker compose up db`
- A free [Groq API key](https://console.groq.com/keys) for live AI responses (optional)

---

## Quick start

Clone, then start each service in its own terminal.

### 1. Backend API — `-yatrubackend-`

```bash
cd -yatrubackend-
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # then edit: set SECRET_KEY at minimum
python manage.py migrate
python manage.py runserver
```

API is served at `http://localhost:8000/api/` (versioned alias: `/api/v1/`).
Django admin is at `http://localhost:8000/admin/` (`python manage.py createsuperuser`).

### 2. Frontend — `-yatruSathiFrontend-`

```bash
cd -yatruSathiFrontend-
npm install
cp .env.example .env            # point VITE_API_BASE_URL at the backend
npm run dev
```

App runs at `http://localhost:5173`.

### 3. AI chatbot — `-Yatrusathi-AIchatbot`

```bash
cd -Yatrusathi-AIchatbot
python3 -m venv venv && source venv/bin/activate
pip install flask flask-cors flask-socketio groq python-dotenv supabase
cp .env .env.local 2>/dev/null || true   # edit .env: set GROQ_API_KEY, GROQ_MODEL
python app.py
```

Service runs at `http://localhost:5005`. Without `GROQ_API_KEY` it still runs and
answers from the knowledge base using templated responses.

---

## Configuration

Each service reads its own `.env`. Never commit real secrets — every `.env` is gitignored.

### Backend (`-yatrubackend-/.env`)

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django secret. Required when `DEBUG=False`. |
| `DEBUG` | Defaults to `False`. |
| `ALLOWED_HOSTS` | Comma‑separated hostnames. |
| `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` | Browser origins allowed to call the API. |
| `BACKEND_URL` | Public base URL, used to build absolute media URLs. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email (OTP). SMTP vars are the dev fallback. |

### Database (`-yatrubackend-/.env`)

PostgreSQL is required — there is no local-file fallback, so a misconfigured
database fails at startup instead of silently writing to throwaway storage.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Full DSN, e.g. `postgres://user:pass@host:5432/dbname`. Preferred. |
| `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Discrete alternative, used when `DATABASE_URL` is unset. |
| `DB_SSL_REQUIRE` | Require TLS to the database. `True` for RDS, `False` for a local container. |
| `DB_CONN_MAX_AGE` | Seconds to reuse a connection (default `600`); `0` disables persistent connections. |

`docker compose up db` starts a local Postgres matching the values in
[`.env.example`](.env.example). Migrating an existing `db.sqlite3` is a one-off:

```bash
cd -yatrubackend-
export DATABASE_URL='postgres://yatrusathi:yatrusathi-dev-password@localhost:5432/yatrusathi'
bash scripts/import_from_sqlite.sh
```

### Frontend (`-yatruSathiFrontend-/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL — must end with a trailing slash. |
| `VITE_CHATBOT_URL` | AI service URL. Leave blank to disable the assistant. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase anon access (RLS‑enforced). |

### AI service (`-Yatrusathi-AIchatbot/.env`)

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq Cloud key. Unset ⇒ templated fallback answers. |
| `GROQ_MODEL` | Model id, e.g. `llama-3.3-70b-versatile`. |
| `SUPABASE_URL` / `SUPABASE_KEY` | Optional; enables non‑blocking chat logging. |

---

## API surface (backend)

Base prefix `/api/` (or `/api/v1/`). User endpoints use `Authorization: Token <token>`.

- **Auth** — `auth/signup/`, `auth/login/`, `auth/logout/`, `auth/verify-otp/`,
  `auth/resend-otp/`, `auth/forgot-password/{request-otp,verify-otp,reset}/`
- **Activities** — `activities/`, `activities/{id}/`, `activities/{id}/reviews/`,
  `activities/{id}/chat/` (legacy `events/…` aliases still resolve)
- **Catalogue** — `destinations/`, `destinations/{slug}/`, `activity-types/`,
  `packages/`, `packages/{slug}/`, `package-bookings/`, `dashboard/summary/`
- **Bookings** — `bookings/`, `bookings/{id}/`, `bookings/{id}/action/`
- **Social** — `reviews/`, `favorites/`, `favorites/{activity_id}/`
- **Notifications** — `notifications/`, `notifications/unread-count/`, `notifications/mark-read/`
- **Group chat** — `groups/`, `groups/{id}/`, `groups/{id}/{mark-read,add-member,remove-member}/`,
  `groups/{id}/chat/`
- **Admin** — `admin/login/`, `admin/kyc-requests/`, `admin/kyc-stats/`, `admin/kyc-requests/{profile_id}/`
- **Users** — `users/`, `users/{id}/profile/`, `profile/`

See [`-yatrubackend-/README.md`](-yatrubackend-/README.md) for request/response detail and the ERD.

## AI service endpoints

- `POST /api/chat` — AI reply with RAG; accepts `message`, `session_id`, `event_context`
- `POST /api/chat/stream` — same, streamed token‑by‑token over Server‑Sent Events
- `DELETE /api/session/<session_id>` — clear a session's conversation memory
- `GET /health` — liveness probe
- Socket.IO events — `join_group`, `leave_group`, `group_message` (mention `@ai` in a
  group message to get an AI reply in‑room)

---

## Testing

```bash
# Backend
cd -yatrubackend- && pytest

# Frontend
cd -yatruSathiFrontend- && npm run lint && npx tsc --noEmit && npm run build
```

---

## Containers

All three services have a Dockerfile and are orchestrated by
[`docker-compose.yml`](docker-compose.yml):

```bash
cp .env.example .env      # optional — every value has a default
docker compose up --build
# frontend :8080   backend :8000/api/   chatbot :5005
```

Compose runs all three tiers: the `db` Postgres container, the Django API, and
the nginx-served React bundle (plus the AI side-car). The backend waits for the
database, migrates, then serves. Postgres data lives in the `postgres_data`
volume — `docker compose down` keeps it, `down -v` discards it.

## CI/CD

`.github/workflows/ci.yml` on every push / PR: build + test + lint all three
services, `gitleaks` secret scan, `hadolint` Dockerfile lint, Trivy dependency +
image scans. `.github/workflows/codeql.yml` runs CodeQL for Python and JS/TS.
Dependabot ([.github/dependabot.yml](.github/dependabot.yml)) keeps pip, npm,
GitHub Actions and Docker base images patched.

On push to `main`: push images to ECR (OIDC, no static keys) → deploy to the
**staging** namespace. Production is a **manual** promotion (`workflow_dispatch`),
optionally gated by the `production` GitHub Environment.

## Deployment

- **AWS EKS (primary)** — Terraform in [`infra/terraform/`](infra/terraform) provisions
  the VPC, EKS cluster (+ Container Insights, metrics-server), ECR repos, RDS
  Postgres, per-environment Secrets Manager secrets and the GitHub OIDC deploy
  role. Kustomize [`k8s/base`](k8s/base) + `overlays/{staging,production}` define
  the workloads, HPAs and an ALB Ingress. Full runbook:
  [`docs/deployment-eks.md`](docs/deployment-eks.md); secret handling:
  [`docs/secret-rotation.md`](docs/secret-rotation.md).
- **Backend on Render (legacy)** — [`-yatrubackend-/render.yaml`](-yatrubackend-/render.yaml);
  note Render's filesystem is ephemeral.
- **Frontend** — `npm run build` emits a static bundle in `dist/` for any static host.

---

## Project documentation

- [`AUDIT_REPORT.md`](AUDIT_REPORT.md) — full codebase audit (architecture, security, maintainability)
- [`REFACTORING_QUICK_START.md`](REFACTORING_QUICK_START.md) — phased refactoring plan
- [`REFACTORING_CHANGES.md`](REFACTORING_CHANGES.md) — what has been changed so far
