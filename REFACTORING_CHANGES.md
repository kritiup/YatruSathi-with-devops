# Refactoring — What Changed

Work done against `REFACTORING_QUICK_START.md` Phases 1–3. Scope: the
`-yatrubackend-` and `-yatruSathiFrontend-` repos.

Verification at time of writing:

- Backend: `python manage.py check` clean, **25 pytest tests pass** (SQLite).
- Frontend: `tsc --noEmit` clean, `vite build` succeeds, eslint errors
  down 47 → 31 (all remaining are pre-existing `any` / unused-import in files
  not touched here).

---

## Phase 1 — Security & foundation (backend)

| Item | Change |
| --- | --- |
| Exposed `.env` | `git rm --cached`, added to purge; **history rewritten** with `git-filter-repo` to drop `.env` and `db.sqlite3` from all 35 commits. Local `.env` restored from backup, now gitignored. **Not yet force-pushed** — see below. |
| `.env.example` | Added, with placeholders for every key the app reads. |
| `SECRET_KEY` | Now `os.getenv('SECRET_KEY')`. In production an unset key raises `ImproperlyConfigured`; in DEBUG it falls back to a local-only dummy. |
| `DEBUG` | Defaults to **False** (`env_bool('DEBUG', False)`). |
| Debug OTP endpoints | `event/api/debug_otp.py` deleted, routes removed. These let anyone activate any account. |
| HTTPS hardening | Production-only: `SECURE_SSL_REDIRECT`, HSTS, secure cookies, `X_FRAME_OPTIONS=DENY`, nosniff. |
| CORS | `CORS_ALLOW_ALL_ORIGINS` removed (it is unsafe with `ALLOW_CREDENTIALS`). Origins now come from `CORS_ALLOWED_ORIGINS` env, falling back to the previous static list. |
| `requirements/` | `base.txt` / `dev.txt` / `prod.txt`, plus a root `requirements.txt` that includes `prod.txt` (Render's build script target). |
| `.pyc` files | Untracked (they were committed despite `.gitignore`). |

## Phase 2 — Backend architecture

- **`models.py` (262 lines) → `event/models/`** package: `event.py`, `auth.py`,
  `profile.py`, `booking.py`, `chat.py`, `social.py`, `notification.py`.
  Re-exported from `__init__.py` so `from event.models import X` is unchanged.
  Added `Meta.ordering` and an `Event.is_full` helper (migration `0024`, options-only).
- **`serializers.py` (156 lines) → `event/serializers/`** package by domain.
  Locked down writable fields that should not be client-settable:
  `Profile.kyc_status` / `is_kyc_verified`, `Booking.status`,
  `Notification.message`, `ChatMessage.is_system`. Added range/consistency
  validation (rating 1–5, ticket_count ≥ 1, event date/participant bounds).
- **`views.py` (524 lines) → `event/views/`** package by domain.
- **Service layer** — new: `booking_service`, `chat_service`,
  `notification_service`, `profile_service`; `event_service` rewritten.
  Fixed a latent bug where new-event notifications passed a nonexistent
  `type=` kwarg and silently never sent.
- **Mixed API patterns** — deleted the duplicate function views
  (`event_list.py`, `event_detail.py`, `user_list.py`); everything is now
  class-based. `booking_action.py` and the admin KYC endpoints now call the
  service layer.
- **`event/shared/`** — `pagination.py` (opt-in: only paginates when `?page=`
  is present, so existing array-consuming clients are unaffected),
  `exceptions.py` (one error envelope: `{"error": {"code", "message"}}`),
  `permissions.py` (`IsOwnerOrReadOnly`, `IsEventCreator`, `IsGroupMember`,
  `IsPlatformAdmin`).
- **Fixed** a 500 in participant-rating: it did `raise status.HTTP_403_FORBIDDEN(...)`
  (an int is not callable). Now returns a proper 403.
- **API versioning** — mounted at `/api/v1/` with `/api/` kept as an alias.
- **Tests** — `event/tests/` with `pytest.ini`, `conftest.py` fixtures, and
  25 API tests covering the new permission rules, error envelope, pagination
  shape, booking side effects, and that the debug endpoints are gone.

## Phase 3 — Frontend architecture

- **`src/common/`** — new shared layer:
  - `constants/` — `endpoints`, `routes`, `storage` keys, `statuses`, `messages`.
  - `utils/` — `errors.ts` (`getApiErrorMessage` handles old and new error
    shapes), `storage.ts`, `formatters.ts` (incl. `toList` for
    array-or-`{results}`).
  - `hooks/` — `useAuth`, `useApi`, `useDebounce`, `useEvents`, `useNotifications`.
  - `components/ErrorBoundary.tsx`, wired into `main.tsx`.
- **`api/api.ts`** — interceptor now flattens the backend's new
  `{error:{message}}` envelope back to a string on `data.error`, so the ~12
  existing call sites that read `err.response.data.error` keep working.
- **`profile-page.tsx` 1395 → 250 lines.** Split into `types.ts`,
  `hooks/useProfileData.ts`, and `components/` (`ProfileHeader`,
  `ProfileInfoTab`, `MyEventsTab`, `KycVerificationForm`). JSX moved verbatim.
- **`event-details.tsx` 946 → 299 lines.** Split into `event-details.types.ts`,
  `hooks/useEventDetails.ts`, and `components/event-details/`
  (`BookingRequestsList`, `ReviewSection`, `BookingDialog`, `EventSidebar`).
- **`services/api/*.ts`** — all five services now use the `ENDPOINTS`
  constants and return plain arrays from list methods via `toList`.
- **`.env`** — untracked and gitignored (`.gitignore` had no `.env` rule).
  `.env.example` genericised.

---

## You still need to do

1. **Rotate every credential** that was in the backend `.env` — Supabase keys,
   the Postgres password (`Minorproject@123`), and the Gmail app password.
   History rewriting does not un-leak a key that was already pushed; rotation
   is the actual fix.
2. **Force-push the rewritten backend history** (coordinate with the team —
   every existing clone must re-clone):
   ```
   cd -yatrubackend-
   git push origin --force --all
   git push origin --force --tags
   ```
3. **Frontend `.env` history** — it only ever held the Supabase *anon* key
   (public by design) and the API URL, so a history purge is optional. If you
   want it anyway, same `git-filter-repo --invert-paths --path .env` flow.
4. `pip install -r requirements/dev.txt` to pick up `django-filter` and the
   test/lint tooling in the shared venv.
5. Frontend: the pre-existing eslint errors in `events.tsx`, `my-events.tsx`,
   `add-event-form.tsx`, etc. (unused imports, `any`) are untouched and still
   there — worth a cleanup pass.

## Database switched to SQLite

The Supabase Postgres instance in `.env` stopped authenticating
(`FATAL: tenant/user ... not found`). The app now uses **SQLite**
unconditionally (`db.sqlite3` at the project root; `SQLITE_PATH` overrides the
location).

- `settings.py` — removed the `dj_database_url` Postgres branching, the
  `sslmode`/`connect_timeout` block, and the unused `supabase_client`
  (nothing imported it). `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_*` are no
  longer read.
- `requirements/base.txt` — dropped `dj-database-url`, `psycopg2-binary`,
  `supabase`.
- `.env` / `.env.example` — Postgres and Supabase keys removed.
- `scripts/build.sh`, `scripts/start.sh` — migrate plainly (no `DIRECT_URL`).
- `render.yaml` — dropped the DB/Supabase env vars; added a note that Render's
  filesystem is ephemeral, so a persistent disk (or a managed DB) is needed
  before relying on SQLite there.

Verified: `manage.py check` clean, `migrate` clean, 25 tests pass,
`runserver` serves `/api/`, `/api/events/`, `/api/v1/events/` all `200`.

## Dead code removed

**Frontend** (all verified to have zero references; `tsc` + `vite build` still pass):

- `src/App.tsx` — legacy standalone page, not in `main.tsx` / `routes.tsx`
- `src/pages/notification.tsx` — superseded by `pages/events/notifications.tsx`
- `src/pages/home/notifications.tsx` — empty file
- `src/pages/events/types.ts`, `src/types/events.tsx` (+ empty `src/types/`) — unused type stubs
- `src/pages/events/eventsData.ts`, `src/pages/events/sample-event.ts` — unused mock data
- `src/components/EventList.jsx` (+ `.jsx.d.ts`) — unused, and the only `.jsx` in the project
- `src/services/api.ts` — a 2-line re-export shim; its 3 live importers now import `api/api` directly

**Backend**

- `test_api.py` — ad-hoc manual script, superseded by `event/tests/`
- Root-level `db.sqlite3` (0 bytes, tracked) — untracked and removed

**Repo root** (`/Users/admin/projects/backend/`)

- `package.json` + `package-lock.json` + `node_modules/` (12 MB) — an accidental
  `npm i react-router-dom` in the wrong directory; the real frontend lives in
  `-yatruSathiFrontend-/` and uses `react-router`.

`test_admin_api.py` was **left in place** — it has uncommitted edits of yours.
`src/services/socketService.ts` was **kept** — unused today but it is the
WebSocket client for the not-yet-wired real-time chat.

## Not done (later phases)

Docker, CI/CD, the remaining component splits (`my-events` 568,
`add-event-form` 492, `chatbox` 437, `dashboard` 388, `notifications` 367,
`footer` 362, `kyc-approval` 580), a global store, and broader test coverage.

## Backups

Full pre-change copies of both repos (incl. `.git`) are under the session
scratchpad: `backup-1788096995/` and `pre-purge-1788100535/`.
