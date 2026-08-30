# YatruSathi Codebase Audit Report

**Date:** August 30, 2026  
**Project:** YatruSathi - Smart Tourism/Group Travel Platform  
**Status:** Functional but needs significant refactoring for production readiness

---

## Executive Summary

YatruSathi is a Django REST Framework + React/TypeScript full-stack application for tourism and group travel management. The codebase is functional but exhibits several architecture, security, and maintainability issues that require refactoring before production deployment.

**Key Findings:**

- ⚠️ **CRITICAL:** Exposed secrets in `.env` file committed to git
- ⚠️ **CRITICAL:** Hardcoded Django SECRET_KEY in settings.py
- ⚠️ **HIGH:** Large monolithic views (524 lines)
- ⚠️ **HIGH:** Large frontend components (1395 lines)
- ⚠️ **HIGH:** No requirements.txt file for Python dependencies
- ⚠️ **HIGH:** Mixed API patterns (old views + new modular API structure)
- ⚠️ **MEDIUM:** Poor folder organization
- ⚠️ **MEDIUM:** Limited error handling
- ✅ **GOOD:** Decent separation of concerns with repositories/services

---

## Part 1: Project Structure Analysis

### 1.1 Backend Structure

```
-yatrubackend-/
├── backend/                      # Django config
│   ├── settings.py              # ⚠️ Contains hardcoded SECRET_KEY
│   ├── urls.py                  # Root URL config
│   ├── asgi.py
│   ├── wsgi.py
├── event/                        # Main Django app
│   ├── models.py                # ⚠️ Large file (262 lines), multiple concerns
│   ├── views.py                 # ⚠️ CRITICAL: 524 lines, monolithic
│   ├── serializers.py           # 156 lines, could be split
│   ├── urls.py                  # Mixed old/new patterns
│   ├── middleware.py            # Request logging
│   ├── authentication.py        # Auth utilities
│   ├── admin.py                 # Django admin
│   ├── api/                     # New modular API pattern ✓
│   │   ├── login.py
│   │   ├── signup.py
│   │   ├── logout.py
│   │   ├── verify_otp.py
│   │   ├── resend_otp.py
│   │   ├── forgot_password.py
│   │   ├── event_list.py
│   │   ├── event_detail.py
│   │   ├── user_list.py
│   │   ├── booking_action.py
│   │   ├── debug_otp.py         # ⚠️ Debug endpoints in production
│   │   ├── admin_login.py
│   │   ├── admin_kyc_approve.py
│   │   └── admin_kyc_list.py
│   ├── repositories/            # Good pattern ✓
│   │   ├── base_repository.py
│   │   ├── event_repository.py
│   │   └── user_repository.py
│   ├── services/                # Good pattern ✓
│   │   ├── auth_service.py      # 8KB - comprehensive
│   │   └── event_service.py
│   └── migrations/              # 27+ migrations
├── data/                        # Sample data
│   └── seed.json
├── media/                       # User uploads ✓
├── manage.py
├── .env                         # ⚠️ EXPOSED SECRETS
├── .env.example                 # Missing
├── .gitignore                   # Present ✓
└── README.md
```

**Backend Issues:**

- No `requirements.txt` or `setup.py` (dependencies unclear)
- No `.env.example` template
- Settings.py hardcodes SECRET_KEY and has basic structure
- No Docker setup
- No formal logging configuration
- Basic test file but likely unused

### 1.2 Frontend Structure

```
-yatruSathiFrontend-/
├── src/
│   ├── api/
│   │   └── api.ts              # ✓ Centralized API client with interceptors
│   ├── components/
│   │   ├── EventList.jsx       # ⚠️ Mixed .jsx in .tsx project
│   │   └── admin/
│   │       ├── AdminSidebar.tsx
│   │       └── AdminLayout.tsx
│   ├── layout/                 # ⚠️ Mixed concerns
│   │   ├── dashboard.tsx       # 388 lines (large)
│   │   ├── main-layout.tsx
│   │   ├── public-layout.tsx
│   │   ├── sidebar.tsx         # 212 lines
│   │   └── footer.tsx          # 362 lines
│   ├── pages/                  # ⚠️ Large components
│   │   ├── home/
│   │   │   ├── index.tsx       # 305 lines
│   │   │   ├── notifications.tsx   # 367 lines
│   │   │   ├── favorite.tsx
│   │   │   └── components/
│   │   ├── profile/
│   │   │   └── profile-page.tsx    # ⚠️ 1395 lines - MONOLITHIC
│   │   ├── events/
│   │   │   ├── events.tsx      # 268 lines
│   │   │   ├── event-details.tsx   # 946 lines
│   │   │   ├── my-events.tsx   # 568 lines
│   │   │   ├── add-event-form.tsx  # 492 lines
│   │   │   ├── register-form.tsx   # 242 lines
│   │   │   └── notifications.tsx   # 367 lines
│   │   ├── chat/
│   │   │   ├── chatbox.tsx     # 437 lines
│   │   │   └── aichatbot.tsx   # 247 lines
│   │   ├── login/
│   │   ├── signup/
│   │   ├── admin/
│   │   ├── verify-otp/
│   │   ├── forgot-password/
│   │   └── landing/
│   ├── services/               # Missing! ⚠️
│   ├── types/
│   │   └── events.tsx          # Type definitions
│   ├── App.tsx                 # Main app component
│   ├── app-config.ts           # Configuration
│   ├── main.tsx
│   ├── routes.tsx              # Routing configuration
│   ├── theme.tsx
│   └── vite-env.d.ts
├── package.json                # Modern stack ✓
├── vite.config.ts              # Vite setup ✓
├── tsconfig.json               # TypeScript config ✓
├── eslint.config.js            # ESLint configured ✓
└── .gitignore
```

**Frontend Issues:**

- **CRITICAL:** `profile-page.tsx` has 1,395 lines (should be max 300)
- **CRITICAL:** No custom hooks extracted
- **HIGH:** Multiple components exceeding 400 lines
- **HIGH:** No dedicated services layer (API calls scattered across components)
- **HIGH:** No state management (Context API, Redux, Zustand)
- **MEDIUM:** Mixed .jsx and .tsx files
- **MEDIUM:** No shared/common utilities folder
- **MEDIUM:** No constants file
- **MEDIUM:** Theme defined but not consistently used
- **MEDIUM:** No error boundary components
- No Storybook or component documentation

### 1.3 AI Chatbot (Separate Package)

```
-Yatrusathi-AIchatbot/
├── aichatbot.py
├── app.py
├── chatbot.py
├── knowledge_base.py
└── templates/
    └── index.html
```

**Issues:**

- Appears to be Flask-based (separate from main Django project)
- Not integrated with frontend
- No clear separation of concerns
- Likely uses Gemini API (credentials unclear)

### 1.4 Configuration & Deployment

```
Root files:
├── .env                        # ⚠️ EXPOSED in git
├── .gitignore                  # ✓ Present
├── package.json                # Root-level deps (minimal)
├── Procfile                    # For Render deployment
├── render.yaml                 # Render config
├── db.sqlite3                  # ⚠️ SQLite in git (not production)
├── build.sh                    # Build script
├── start.sh                    # Start script
└── scripts/
    ├── build.sh
    ├── deploy_setup.sh
    ├── seed_db.py
    ├── setup.sh
    └── utils.py
```

**Issues:**

- No Docker/docker-compose
- No CI/CD pipeline (.github/workflows missing)
- No Kubernetes manifests
- Render.yaml present but basic
- Scripts exist but not well documented

---

## Part 2: Critical Security Issues

### 2.1 Exposed Secrets (CRITICAL)

**File:** `-yatrubackend-/.env`

```
SUPABASE_URL=https://jdgzbxycotncnwxusqxy.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.jdgzbxycotncnwxusqxy:Minorproject%40123@...
DIRECT_URL=postgresql://postgres.jdgzbxycotncnwxusqxy:Minorproject%40123@...
EMAIL_HOST_PASSWORD=pdfz cneh ojdr ouoi
```

**Risks:**

- All credentials exposed in git repository
- Anyone with git access has full database/Supabase access
- Email account compromised
- Should regenerate all credentials immediately

### 2.2 Hardcoded Django SECRET_KEY (CRITICAL)

**File:** `-yatrubackend-/backend/settings.py`

```python
SECRET_KEY = 'django-insecure-tj&w$(ff*c@o@419fx4sa)-6#l1f+#77r=l*mz=ccpi!#nu4x6'
```

**Risks:**

- Session tokens can be forged
- CSRF protection bypassed
- Must rotate immediately

### 2.3 Debug Endpoints in Production (HIGH)

**File:** `-yatrubackend-/event/api/debug_otp.py`

**Endpoints:**

- `GET /api/auth/debug/get-otp/` - Returns actual OTP
- `GET /api/auth/debug/skip-otp/` - Bypasses OTP verification

**Risk:** Allows anyone to login as any user without OTP

### 2.4 Debug Mode Enabled

**File:** `-yatrubackend-/backend/settings.py`

```python
DEBUG = os.getenv('DEBUG', 'True') == 'True'
```

**Risk:** Default True exposes stack traces, settings, database queries in production

### 2.5 Weak CORS Configuration (MEDIUM)

May need verification of CORS_ALLOWED_ORIGINS - if too permissive, allows CSRF attacks

### 2.6 No HTTPS Enforcement (MEDIUM)

Settings should enforce HTTPS in production (SECURE_SSL_REDIRECT)

---

## Part 3: Architecture & Design Issues

### 3.1 Backend Issues

#### Mixed API Patterns (HIGH)

**Problem:** Two different API patterns in same codebase

**Old Pattern:** `-yatrubackend-/event/views.py`

```python
class EventListCreateView(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
```

**New Pattern:** `-yatrubackend-/event/api/event_list.py`

```python
@api_view(['GET', 'POST'])
def event_list_api(request):
    # Implementation
```

**Issues:**

- Inconsistent patterns confuse developers
- URL routing becomes complex
- Difficult to maintain and test
- Should standardize on one approach

#### Models.py is Too Large (HIGH)

**File:** `event/models.py` (262 lines)

Contains:

- Event (45+ fields - overloaded)
- EventImage
- EmailOTP
- Notification
- ChatGroup
- ChatGroupReadStatus
- ChatMessage
- Favorite
- Plus Profile, Booking, Review (not shown)

**Issues:**

- Multiple concerns in single file
- Event model has 45+ fields (indicates design issues)
- Should split into separate logical files:
  - models/event.py
  - models/chat.py
  - models/profile.py
  - models/booking.py
  - models/notification.py

#### Views.py is Monolithic (HIGH)

**File:** `event/views.py` (524 lines)

Contains:

- 20+ different view classes/functions
- Authentication logic mixed with view logic
- Chat views, notification views, booking views all together
- Error handling inconsistent

**Should split into:**

- views/event.py
- views/chat.py
- views/notification.py
- views/booking.py
- views/profile.py
- views/review.py

#### Serializers.py is Disorganized (MEDIUM)

**File:** `event/serializers.py` (156 lines)

Contains mixed serializers without clear organization. Should split into:

- serializers/user.py
- serializers/event.py
- serializers/chat.py
- serializers/booking.py
- serializers/profile.py

#### Incomplete Service Layer (MEDIUM)

**Current state:**

- auth_service.py (8KB) - comprehensive ✓
- event_service.py (small) - needs expansion

**Missing services:**

- booking_service.py
- notification_service.py
- profile_service.py
- chat_service.py

#### Incomplete Repository Pattern (MEDIUM)

**Current state:**

- base_repository.py - foundation ✓
- event_repository.py (minimal)
- user_repository.py (minimal)

Should expand to cover all models with consistent CRUD operations

#### No Dependency Injection (MEDIUM)

Services hardcoded into views, difficult to test

#### Permissions Not Properly Defined (MEDIUM)

Only one permission class: `IsOwnerOrReadOnly`

Should implement:

- IsEventCreator
- IsParticipant
- IsAdmin
- Can approve/reject bookings

#### No Pagination (MEDIUM)

List endpoints return all records, inefficient for large datasets

#### No API Versioning (MEDIUM)

No `/api/v1/` prefix, difficult to introduce breaking changes

#### No Proper Error Responses (MEDIUM)

Inconsistent error handling across endpoints

#### No Input Validation (MEDIUM)

Serializers have minimal validation, business logic validation missing

### 3.2 Frontend Issues

#### Monolithic Components (CRITICAL)

| File               | Lines | Severity |
| ------------------ | ----- | -------- |
| profile-page.tsx   | 1,395 | CRITICAL |
| event-details.tsx  | 946   | HIGH     |
| kyc-approval.tsx   | 580   | HIGH     |
| my-events.tsx      | 568   | HIGH     |
| add-event-form.tsx | 492   | HIGH     |
| chatbox.tsx        | 437   | HIGH     |
| dashboard.tsx      | 388   | HIGH     |
| notifications.tsx  | 367   | HIGH     |
| footer.tsx         | 362   | HIGH     |

**Best Practice:** Max 300-350 lines per component

#### No Custom Hooks Extracted (HIGH)

Significant logic embedded in components that should be in hooks:

- useEventFetch
- useAuth
- useNotifications
- useFavorites
- useBooking
- useChat

#### No State Management (HIGH)

All state managed locally:

- Auth state scattered across components
- User profile state duplicated
- Chat state not persisted
- Notifications not globally managed

**Should implement:** Zustand or Context API with proper structure

#### No Services Layer (HIGH)

API calls scattered throughout components instead of centralized services:

- eventService.ts
- authService.ts
- chatService.ts
- notificationService.ts
- bookingService.ts

#### No Constants File (MEDIUM)

Hardcoded strings/values throughout:

- API endpoints
- Status values
- Messages
- Routes

Should create:

- constants/api.ts
- constants/routes.ts
- constants/messages.ts
- constants/statuses.ts

#### Large Forms (MEDIUM)

- add-event-form.tsx (492 lines) - should split into sub-components
- register-form.tsx (242 lines) - should use custom hooks

#### No Error Boundaries (MEDIUM)

No React error boundaries for error handling

#### No Loading States (MEDIUM)

Inconsistent loading indicators

#### No Reusable Components (MEDIUM)

Duplicate UI patterns:

- Buttons
- Cards
- Modals
- Forms
- Inputs

Should create shared components folder:

- shared/Button
- shared/Card
- shared/Modal
- shared/Input
- shared/FormField

#### Mixed File Extensions (LOW)

Mix of `.jsx` and `.tsx` files - should be consistent (use `.tsx`)

#### No Environment Variables (MEDIUM)

API base URL hardcoded in App.tsx instead of using env variables

#### No API Response Types (MEDIUM)

Limited TypeScript usage for API responses, mostly `any` types

### 3.3 Database Issues

#### Field Bloat (MEDIUM)

Event model has 45+ fields - indicates poor data modeling:

- Should separate concerns:
  - Basic event info
  - Location data
  - Financial info
  - Requirements/restrictions
  - Organizer info

#### Denormalization (MEDIUM)

Fields like `organizer_name`, `contact_email` duplicated from Profile/User

#### No Audit Fields (LOW)

No `created_at`, `updated_at` on several models (though many have them)

#### Soft Deletes Not Implemented (LOW)

Hard deletes cascade, data loss possible

---

## Part 4: Code Quality Issues

### 4.1 Testing

**Current State:**

- `event/tests.py` - empty (3 lines)
- No test structure
- No CI/CD pipeline

**Missing:**

- Unit tests (models, serializers, services)
- Integration tests (API endpoints)
- Frontend component tests
- E2E tests

### 4.2 Logging

**Current State:**

- Basic request logging middleware
- Logger configured in views
- No log levels strategy

**Needs:**

- Centralized logging configuration
- Log levels per module
- Log rotation
- Structured logging (JSON)
- Log aggregation ready

### 4.3 Documentation

**Current State:**

- README.md present
- API_DOCUMENTATION.md mentioned but not reviewed

**Missing:**

- Architecture documentation
- API documentation (OpenAPI/Swagger)
- Component documentation (Storybook)
- Setup guide
- Deployment guide
- Database schema documentation
- Contributing guidelines

### 4.4 Type Safety

**Backend:**

- No type hints in Python code

**Frontend:**

- Incomplete TypeScript usage
- Many `any` types
- API response types not properly typed

### 4.5 Code Organization

**Backend:**

- No clear layering (models → serializers → views → services)
- Services are thin (mostly auth)
- Business logic mixed with HTTP concerns

**Frontend:**

- No separation of concerns
- Logic mixed with UI
- State scattered across components

### 4.6 Naming Conventions

**Issues Found:**

- Mixed snake_case/camelCase in API responses
- Component names could be more descriptive
- Generic names like "components/admin/" without clear purpose

---

## Part 5: DevOps & Deployment Issues

### 5.1 No Docker Setup (CRITICAL)

- No Dockerfile
- No docker-compose.yml
- Can't reproducibly build/deploy

### 5.2 No CI/CD Pipeline (HIGH)

- No GitHub Actions
- No automated tests on commit
- No automated deployments
- Manual deployment to Render

### 5.3 No Environment Management (HIGH)

- Only `.env` file, no `.env.example`
- No environment-specific configs (dev/staging/prod)
- Settings.py doesn't use environment properly

### 5.4 No Database Migrations Strategy (MEDIUM)

- Migrations present but no clear deployment strategy
- No backup strategy
- No rollback plan

### 5.5 Static Files Not Optimized (MEDIUM)

- WhiteNoise configured but not optimized
- Frontend not built/minified separately
- No CDN configuration

### 5.6 No Monitoring/Observability (MEDIUM)

- No error tracking (Sentry, etc.)
- No performance monitoring
- No log aggregation

### 5.7 No Health Checks (MEDIUM)

- No liveness/readiness probes
- No graceful shutdown handling

---

## Part 6: Feature Completeness

### Implemented ✓

- User authentication (email/OTP)
- Event CRUD operations
- Event browsing and search
- User profiles
- Event bookings
- Reviews/ratings
- Chat (event and group)
- Notifications
- Favorites/Wishlist
- Admin KYC approval
- AI chatbot (separate)
- Multiple user roles

### Partially Implemented ⚠️

- Real-time chat (not implemented)
- Notifications (no WebSocket)
- Admin dashboard (basic)

### Missing ✗

- Payment integration (financial fields exist but no implementation)
- Map integration (field exists, not used)
- Email notifications
- SMS integration
- Analytics
- Reporting
- Advanced search/filters
- User blocking/reporting
- Dispute resolution

---

## Part 7: Proposed Target Structure

### 7.1 Backend Target Structure

```
backend/
├── config/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py              # Shared settings
│   │   ├── development.py       # Dev settings
│   │   ├── staging.py           # Staging settings
│   │   ├── production.py        # Production settings
│   │   └── test.py              # Test settings
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── core/                    # Shared utilities
│   │   ├── models.py            # Base models
│   │   ├── mixins/
│   │   ├── management/
│   │   └── tests.py
│   ├── authentication/          # Auth app
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── events/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── event.py
│   │   │   └── image.py
│   │   ├── serializers/
│   │   │   ├── __init__.py
│   │   │   └── event.py
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── event.py
│   │   │   └── image.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── event_service.py
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   └── event_repository.py
│   │   ├── permissions.py
│   │   ├── filters.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── profiles/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── bookings/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── chat/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── notifications/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── admin/
│   │   ├── views.py
│   │   ├── services.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── tests/
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── urls.py
│           └── routers.py
├── shared/
│   ├── exceptions.py
│   ├── permissions.py
│   ├── mixins.py
│   ├── decorators.py
│   ├── utils.py
│   ├── validators.py
│   └── pagination.py
├── libs/
│   ├── supabase_client.py
│   ├── email_service.py
│   ├── otp_service.py
│   ├── storage.py
│   └── ai_integration.py
├── management/
│   └── commands/
├── tests/
│   ├── conftest.py
│   ├── factories.py
│   ├── fixtures/
│   └── test_*.py
├── logs/
├── media/
├── staticfiles/
├── scripts/
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   ├── staging.txt
│   └── prod.txt
├── .env.example
├── .env.test
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── pytest.ini
├── .github/
│   └── workflows/
│       ├── tests.yml
│       ├── lint.yml
│       └── deploy.yml
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
└── README.md
```

### 7.2 Frontend Target Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── App.module.css
│   │   └── App.test.tsx
│   ├── common/
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Input/
│   │   │   ├── ErrorBoundary/
│   │   │   ├── Loading/
│   │   │   ├── EmptyState/
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   ├── localStorage.ts
│   │   │   ├── date-utils.ts
│   │   │   └── index.ts
│   │   └── constants/
│   │       ├── api.ts
│   │       ├── routes.ts
│   │       ├── messages.ts
│   │       ├── statuses.ts
│   │       └── index.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   ├── Login/
│   │   │   │   ├── Signup/
│   │   │   │   ├── VerifyOtp/
│   │   │   │   └── ForgotPassword/
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx
│   │   │   ├── store/ (if using Zustand)
│   │   │   │   └── authStore.ts
│   │   │   ├── types/
│   │   │   │   └── auth.ts
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── pages/
│   │   │   │   ├── EventsList/
│   │   │   │   ├── EventDetails/
│   │   │   │   ├── CreateEvent/
│   │   │   │   ├── MyEvents/
│   │   │   │   └── EventGallery/
│   │   │   ├── components/
│   │   │   │   ├── EventCard/
│   │   │   │   ├── EventForm/
│   │   │   │   ├── EventFilters/
│   │   │   │   └── ParticipantsList/
│   │   │   ├── services/
│   │   │   │   └── eventService.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useEvents.ts
│   │   │   │   ├── useEventDetail.ts
│   │   │   │   └── useEventFilters.ts
│   │   │   ├── store/
│   │   │   │   └── eventStore.ts
│   │   │   ├── types/
│   │   │   │   └── event.ts
│   │   │   └── index.ts
│   │   ├── bookings/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── admin/
│   ├── layout/
│   │   ├── MainLayout/
│   │   ├── PublicLayout/
│   │   ├── DashboardLayout/
│   │   ├── AdminLayout/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   └── Navigation/
│   ├── config/
│   │   ├── apiConfig.ts
│   │   ├── appConfig.ts
│   │   └── environment.ts
│   ├── theme/
│   │   ├── theme.ts
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── breakpoints.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── common.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── apiInterceptors.ts
│   │   │   └── endpoints.ts
│   │   ├── storage/
│   │   │   └── localStorage.ts
│   │   └── logger/
│   │       └── logger.ts
│   ├── main.tsx
│   ├── routes.tsx
│   └── vite-env.d.ts
├── public/
├── .env.example
├── .env.development
├── .env.test
├── .env.production
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── prettier.config.js
├── vitest.config.ts
├── package.json
├── .github/
│   └── workflows/
│       ├── lint.yml
│       ├── tests.yml
│       └── build.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── COMPONENT_GUIDE.md
│   ├── SETUP.md
│   └── TESTING.md
└── README.md
```

---

## Part 8: Refactoring Plan

### Phase 1: Critical Security & Stability (Week 1-2)

**Objectives:**

- Remove exposed secrets
- Fix hardcoded values
- Remove debug endpoints
- Enable HTTPS
- Create proper .env.example

**Tasks:**

1. Rotate all credentials (Supabase, database, email)
2. Remove `.env` from git history (git filter-branch or BFG)
3. Create `.env.example` with placeholders
4. Generate new Django SECRET_KEY
5. Remove debug endpoints (`debug_otp.py`)
6. Set DEBUG=False by default, use environment variable
7. Implement HTTPS enforcement for production
8. Create GitHub-level secrets for CI/CD
9. Add pre-commit hooks to prevent secret commits

**Deliverables:**

- Rotated credentials
- Clean git history
- `.env.example` template
- Security checklist passed

---

### Phase 2: Backend Architecture (Week 3-4)

**Objectives:**

- Split monolithic files
- Standardize API patterns
- Improve organization
- Set up proper layering

**Tasks:**

**2.1 Reorganize Project Structure**

- Create `config/settings/` with environment-specific configs
- Create `apps/` directory structure as proposed
- Move event app to apps/events with submodules
- Create shared utilities module

**2.2 Split Models**

- Split `event/models.py` into:
  - `apps/events/models/event.py`
  - `apps/events/models/image.py`
  - `apps/profiles/models.py`
  - `apps/bookings/models.py`
  - `apps/chat/models.py`
  - `apps/notifications/models.py`

**2.3 Split Views**

- Migrate all views from `event/views.py` to new structure
- Split by domain (events, profiles, bookings, chat, notifications)
- Standardize on function-based views with decorators (or standardize on ViewSets)

**2.4 Expand Serializers**

- Create serializers modules for each app
- Add nested serializers where appropriate
- Add validation at serializer level

**2.5 Standardize API Pattern**

- Choose: ViewSets + Routers OR Function-based views
- Recommend: ViewSets + DRF Routers (more scalable)
- Add API versioning: `/api/v1/`
- Add pagination, filtering, ordering

**2.6 Expand Service Layer**

- Create services for all business logic:
  - EventService
  - BookingService
  - ChatService
  - NotificationService
  - ProfileService
- Move business logic out of views

**2.7 Expand Repository Layer**

- Implement proper repository pattern
- Add query optimization
- Add caching where appropriate

**2.8 Implement Proper Permissions**

- Create permission classes:
  - IsEventCreator
  - IsParticipant
  - IsAdmin
  - Can view event details, etc.
- Document permission matrix

**2.9 Add API Documentation**

- Use drf-spectacular for OpenAPI/Swagger
- Document all endpoints
- Add request/response examples

**2.10 Add Error Handling**

- Create custom exception classes
- Add exception handlers
- Standardize error responses
- Add proper HTTP status codes

**Deliverables:**

- Reorganized backend code
- Split and organized models/views/serializers
- Expanded services and repositories
- Permission system
- API documentation (Swagger)
- Error handling framework

---

### Phase 3: Frontend Architecture (Week 5-6)

**Objectives:**

- Extract hooks and services
- Implement state management
- Split large components
- Add constants
- Improve organization

**Tasks:**

**3.1 Extract Custom Hooks**
Create hooks for:

- `useAuth()` - authentication state and methods
- `useEvents()` - event fetching and filtering
- `useProfile()` - profile data management
- `useNotifications()` - notifications
- `useChat()` - chat functionality
- `useBooking()` - booking operations
- `useFavorites()` - favorites/wishlist
- `useApi()` - generic API calls with error handling
- `useDebounce()` - debouncing
- `useLocalStorage()` - localStorage helpers

**3.2 Create Services Layer**

- `services/authService.ts` - auth operations
- `services/eventService.ts` - event operations
- `services/profileService.ts` - profile operations
- `services/bookingService.ts` - booking operations
- `services/chatService.ts` - chat operations
- `services/notificationService.ts` - notifications
- `services/api/apiClient.ts` - centralized API client
- `services/api/apiInterceptors.ts` - request/response interceptors

**3.3 Implement State Management**
Choose: Zustand (recommended) or Context API

- `stores/authStore.ts`
- `stores/eventStore.ts`
- `stores/profileStore.ts`
- `stores/uiStore.ts` (for modals, notifications, etc.)
- `stores/notificationStore.ts`

**3.4 Split Large Components**

profile-page.tsx (1395 lines) → Split into:

- `ProfileHeader.tsx` - header section
- `ProfileStats.tsx` - statistics
- `ProfileAbout.tsx` - bio and info
- `ProfileGallery.tsx` - photos
- `ProfileBookings.tsx` - bookings list
- `ProfileReviews.tsx` - reviews section
- `ProfileEdit.tsx` - edit form
- `pages/Profile.tsx` - main component

event-details.tsx (946 lines) → Split into:

- `EventHeader.tsx`
- `EventDescription.tsx`
- `EventMap.tsx`
- `EventParticipants.tsx`
- `EventBookingForm.tsx`
- `EventReviews.tsx`
- `EventChat.tsx`
- `pages/EventDetails.tsx`

Similar splits for other large components

**3.5 Create Constants File**

- `constants/api.ts` - API endpoints
- `constants/routes.ts` - route paths
- `constants/messages.ts` - UI messages
- `constants/statuses.ts` - status enums
- `constants/config.ts` - app configuration

**3.6 Create Shared Components**

- `Button.tsx` with variants
- `Card.tsx`
- `Modal.tsx`
- `Input.tsx` / `TextField.tsx`
- `FormField.tsx` - with label and error
- `Select.tsx`
- `DatePicker.tsx`
- `Avatar.tsx`
- `Badge.tsx`
- `Tabs.tsx`
- `Pagination.tsx`
- `Loading.tsx` / `Skeleton.tsx`
- `EmptyState.tsx`
- `ErrorBoundary.tsx`
- `Alert.tsx` / `Toast.tsx`

**3.7 Add Type Safety**

- Create proper TypeScript types for all API responses
- Create DTOs for API requests/responses
- Remove `any` types, use `unknown` where needed

**3.8 Add Environment Variables**

- `.env.development`
- `.env.staging`
- `.env.production`
- Environment-specific API URLs, feature flags, etc.

**3.9 Add Testing Infrastructure**

- Setup Vitest (unit tests)
- Setup React Testing Library
- Add test files for components, hooks, services
- Aim for 60%+ coverage

**Deliverables:**

- Custom hooks for all major features
- Services layer
- State management setup (Zustand)
- Split and organized components
- Constants files
- Shared component library
- Type-safe code
- Test infrastructure

---

### Phase 4: DevOps & Infrastructure (Week 7-8)

**Objectives:**

- Docker support
- CI/CD pipeline
- Environment management
- Testing automation
- Monitoring setup

**Tasks:**

**4.1 Docker Setup**

- Create Dockerfile for backend
  - Multi-stage build (builder → runtime)
  - Python 3.12
  - Optimized layers
- Create Dockerfile for frontend
  - Node builder stage
  - Nginx static server stage
- Create docker-compose.yml
  - Backend service
  - Frontend service
  - Postgres database
  - Redis cache (optional)
  - Nginx reverse proxy
- Create docker-compose.prod.yml for production

**4.2 Backend Requirements Management**

- Create requirements/base.txt
- Create requirements/dev.txt
- Create requirements/staging.txt
- Create requirements/prod.txt
- Pin all versions
- Add necessary packages:
  - `django-environ` - environment variables
  - `drf-spectacular` - API docs
  - `django-cors-headers` ✓ (already present)
  - `psycopg2-binary` - PostgreSQL
  - `pytest` - testing
  - `pytest-django` - Django testing
  - `factory-boy` - test factories
  - `faker` - test data
  - `black` - code formatting
  - `flake8` - linting
  - `isort` - import sorting
  - `celery` - async tasks (optional)
  - `sentry-sdk` - error tracking
  - `gunicorn` - production server
  - `whitenoise` ✓ (already present)

**4.3 GitHub Actions CI/CD**

Create workflows:

- `.github/workflows/tests.yml` - Run pytest on PR
- `.github/workflows/lint.yml` - Lint and format checks
- `.github/workflows/security.yml` - Security scans
- `.github/workflows/deploy-staging.yml` - Deploy to staging
- `.github/workflows/deploy-production.yml` - Deploy to production

**4.4 Testing Setup**

- `pytest.ini` configuration
- `conftest.py` with fixtures
- Test factories for models
- Test database setup
- API endpoint tests
- Frontend component tests with Vitest

**4.5 Code Quality Tools**

- Set up Black for formatting
- Set up isort for imports
- Set up ESLint for frontend
- Set up Prettier for formatting
- Pre-commit hooks
- GitHub branch protection rules

**4.6 Monitoring & Logging**

- Sentry integration for error tracking
- Structured logging (JSON)
- Log aggregation (ELK stack or cloud solution)
- Health check endpoints
- Performance monitoring

**4.7 Database Management**

- Backup strategy
- Migration automation
- Seed data scripts
- Database recovery procedures

**4.8 Deployment Automation**

- Helm charts for Kubernetes (optional)
- Terraform for infrastructure (optional)
- Deployment guides
- Rollback procedures

**Deliverables:**

- Docker setup (dev and prod)
- CI/CD pipeline on GitHub Actions
- Requirements files with proper dependencies
- Testing infrastructure
- Code quality enforcement
- Monitoring and logging setup
- Deployment automation

---

### Phase 5: Documentation & Testing (Week 9-10)

**Objectives:**

- Complete test coverage
- Comprehensive documentation
- API documentation
- Component documentation
- Setup guides

**Tasks:**

**5.1 Backend Testing**

- Unit tests for models
- Unit tests for serializers
- Unit tests for services
- Integration tests for API endpoints
- Fixtures and factories
- Database seeding for tests
- Aim for 70%+ coverage

**5.2 Frontend Testing**

- Component unit tests
- Hook tests
- Service tests
- Integration tests
- E2E tests (Playwright or Cypress)
- Aim for 60%+ coverage

**5.3 Backend Documentation**

- `docs/ARCHITECTURE.md` - Overall design
- `docs/API.md` - API documentation (or Swagger)
- `docs/SETUP.md` - Local development setup
- `docs/DATABASE.md` - Database schema
- `docs/AUTHENTICATION.md` - Auth flow
- `docs/DEPLOYMENT.md` - Production deployment
- `docs/CONTRIBUTING.md` - Contributing guidelines
- `docs/TROUBLESHOOTING.md` - Common issues

**5.4 Frontend Documentation**

- `docs/ARCHITECTURE.md` - State management, file structure
- `docs/COMPONENT_GUIDE.md` - Component library documentation
- `docs/SETUP.md` - Frontend setup
- `docs/TESTING.md` - Testing strategy
- `docs/DEPLOYMENT.md` - Frontend deployment
- Storybook for component showcase (optional but recommended)

**5.5 API Documentation**

- OpenAPI/Swagger documentation (using drf-spectacular)
- Postman collection
- API changelog
- Breaking changes guide

**5.6 Deployment Documentation**

- Single server deployment
- Docker deployment
- Kubernetes deployment (if applicable)
- AWS/Google Cloud/Azure guides
- Render deployment guide update

**5.7 README Updates**

- Project overview
- Tech stack
- Quick start guide
- Development setup
- Testing
- Deployment
- Contributing guidelines
- License

**Deliverables:**

- Comprehensive test suite
- Complete API documentation
- Architecture documentation
- Setup and deployment guides
- Component documentation
- Contributing guidelines

---

### Phase 6: Optional Enhancements (Week 11+)

**High Priority:**

- Real-time chat (WebSocket)
- Email notifications
- Payment integration (Stripe/Razorpay)
- Advanced search/filtering
- Image optimization

**Medium Priority:**

- Analytics dashboard
- Reporting system
- Admin UI improvements
- Mobile app (React Native)
- Push notifications

**Low Priority:**

- Advanced recommendation engine
- Machine learning features
- Multi-language support
- Dark mode
- Performance optimizations

---

## Part 9: Priority Issues Summary

### Critical (Fix Immediately) 🔴

| Issue                       | Impact                 | Effort | Timeline  |
| --------------------------- | ---------------------- | ------ | --------- |
| Exposed secrets in git      | Security breach        | High   | Immediate |
| Hardcoded Django SECRET_KEY | Session spoofing       | Medium | Immediate |
| Debug endpoints enabled     | Complete auth bypass   | Low    | 1 day     |
| DEBUG=True default          | Information disclosure | Low    | 1 day     |
| No requirements.txt         | Deployment impossible  | Medium | 1 day     |

### High Priority (Week 1-2) 🟠

| Issue                         | Impact                   | Effort    | Timeline |
| ----------------------------- | ------------------------ | --------- | -------- |
| Monolithic views (524 lines)  | Maintainability          | High      | 1 week   |
| Large components (1395 lines) | Maintainability          | High      | 1 week   |
| No state management           | Performance/UX           | High      | 1 week   |
| Mixed API patterns            | Confusion, inconsistency | High      | 1 week   |
| No tests                      | Quality, reliability     | Very High | 2 weeks  |

### Medium Priority (Week 3-4) 🟡

| Issue                | Impact                | Effort | Timeline |
| -------------------- | --------------------- | ------ | -------- |
| No Docker            | Deployment friction   | Medium | 1 week   |
| Model field bloat    | Design issues         | Medium | 1 week   |
| No error handling    | User experience       | High   | 1 week   |
| No API documentation | Onboarding difficulty | Medium | 1 week   |
| Mixed .jsx/.tsx      | Code consistency      | Low    | 1 day    |

### Low Priority (Month 2+) 🟢

| Issue             | Impact               | Effort | Timeline |
| ----------------- | -------------------- | ------ | -------- |
| Component naming  | Code clarity         | Low    | 1 day    |
| Missing constants | Code maintainability | Low    | 1 day    |
| No Storybook      | Dev efficiency       | Low    | 3 days   |
| Log rotation      | Operations           | Low    | 1 day    |

---

## Part 10: Quick Wins (Can be done immediately)

1. ✅ Create `.env.example`
2. ✅ Create `.env.local` for local dev (use .env.example as base)
3. ✅ Add pre-commit hooks to prevent secret commits
4. ✅ Remove debug endpoints
5. ✅ Set DEBUG=False by default
6. ✅ Create constants/api.ts and constants/routes.ts
7. ✅ Extract `useAuth()` hook
8. ✅ Create ErrorBoundary component
9. ✅ Add `.env.example` to repo instead of `.env`
10. ✅ Create GitHub issue templates

---

## Conclusion

YatruSathi has a solid foundation but requires significant refactoring to become production-ready. The project needs:

1. **Immediate:** Security fixes (secret rotation, debug endpoints)
2. **Critical:** Architecture improvements (split monolithic files, add state management)
3. **High:** Testing and documentation infrastructure
4. **Important:** DevOps setup (Docker, CI/CD)

Following the phased refactoring plan over 10-12 weeks will transform this into a professional, scalable, maintainable codebase suitable for production deployment and team collaboration.

**Estimated Timeline:**

- Phase 1 (Security): 2 weeks
- Phase 2 (Backend): 2 weeks
- Phase 3 (Frontend): 2 weeks
- Phase 4 (DevOps): 2 weeks
- Phase 5 (Testing/Docs): 2 weeks
- **Total: 10 weeks** (with potential parallelization)

---

## Next Steps

1. Review this audit with the team
2. Prioritize issues based on business needs
3. Allocate resources for each phase
4. Create GitHub issues for each task
5. Begin with Phase 1 (security) immediately
6. Proceed with phases 2-3 in parallel if possible

Would you like me to proceed with implementation of any specific phase?
